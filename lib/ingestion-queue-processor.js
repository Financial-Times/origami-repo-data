'use strict';

const garbagePollInterval = (15 * 60 * 1000); // 15 minutes
let pollInterval = 100;
const idlePollInterval = (30 * 1000); // 30 seconds

module.exports = class IngestionQueueProcessor {

	constructor(app) {
		this.app = app;
		this.logger = app.ft.options.log;
		this.Ingestion = app.model.Ingestion;
		this.Version = app.model.Version;
		this.Bundle = app.model.Bundle;
	}

	async start() {
		this.fetchNextIngestion();
		this.collectGarbage();
	}

	logIngestionProgress(ingestion, data) {
		const log = {};
		if (ingestion) {
			log.url = ingestion.get('url');
			log.tag = ingestion.get('tag');
			log.ingestionType = ingestion.get('type');
		}
		this.log(Object.assign(log, data));
	}

	async fetchNextIngestion() {
		let ingestion;

		try {
			ingestion = await this.Ingestion.fetchLatestAndMarkAsRunning();
			pollInterval = ingestion ? 100 : idlePollInterval;

			if (ingestion) {
				// Log ingestion attempt
				this.logIngestionProgress(ingestion, {
					type: 'attempt',
				});

				// Process version ingestion
				if (ingestion.get('type') === 'version') {
					const version = await this.Version.createFromIngestion(ingestion);
					const url = ingestion.get('url');
					const tag = ingestion.get('tag');

					// Success. Log and destroy ingestion
					this.logIngestionProgress(ingestion, {
						type: 'success',
						version: version.get('id')
					});
					await ingestion.destroy();

					// Announce the new version on Slack
					await this.app.slackAnnouncer.announce(version);

					// Queue a Bundle Ingestion for this Version
					const bundleIngestion = await this.Ingestion.create(url, tag, 'bundle');
					await bundleIngestion.save();
				}

				// Process bundle ingestion
				if (ingestion.get('type') === 'bundle') {
					const version = await this.Version.fetchOneByUrlAndTag(ingestion.get('url'), ingestion.get('tag'));
					const bundles = await this.Bundle.updateBundlesForVersion(version);

					// Success. Log and destroy ingestion
					this.logIngestionProgress(ingestion, {
						type: 'success',
						bundles: bundles.map(bundle => bundle.get('id'))
					});
					await ingestion.destroy();
				}
			}

		} catch (error) {
			await this.handleIngestionError(ingestion, error);
		}

		// Do it all over again
		setTimeout(function () {
			this.fetchNextIngestion();
		}.bind(this), pollInterval);
	}

	async handleIngestionError(ingestion, error) {
		// Log ingestion error
		this.logIngestionProgress(ingestion, {
			type: 'error',
			message: error.message,
			recoverable: Boolean(error.isRecoverable)
		});

		// Update or destory errored ingestion
		if (ingestion && error.isRecoverable === false) {
			await ingestion.destroy();
		}

		if (ingestion && error.isRecoverable !== false) {
			ingestion.set('ingestion_attempts', ingestion.get('ingestion_attempts') + 1);
			ingestion.set('ingestion_started_at', null);
			await ingestion.save();
		}

		// Set a longer wait time if we've hit the GitHub rate limit
		if (error.status === 403 && error.headers && error.headers['x-ratelimit-reset']) {
			const waitTime = (Number(error.headers['x-ratelimit-reset']) * 1000) - Date.now();
			this.log({
				type: 'rate-limit-wait',
				time: waitTime,
				rateLimitReset: (new Date(Number(error.headers['x-ratelimit-reset']) * 1000)).toISOString()
			});
			pollInterval = waitTime;
		}
	}

	async collectGarbage() {
		try {

			// Clear over-attempted ingestions
			const overAttemptedIngestions = await this.Ingestion.fetchOverAttempted();
			for (const overAttemptedIngestion of overAttemptedIngestions.toArray()) {
				this.log({
					type: 'garbage-collection',
					message: 'Ingestion attempted too many times',
					url: overAttemptedIngestion.get('url'),
					tag: overAttemptedIngestion.get('tag')
				});
				await overAttemptedIngestion.destroy();
			}

			// Allow long-running ingestions to be attempted again
			const overRunningIngestions = await this.Ingestion.fetchOverRunning();
			for (const overRunningIngestion of overRunningIngestions.toArray()) {
				this.log({
					type: 'garbage-collection',
					message: 'Ingestion ran for too long',
					url: overRunningIngestion.get('url'),
					tag: overRunningIngestion.get('tag')
				});
				overRunningIngestion.set('ingestion_started_at', null);
				await overRunningIngestion.save();
			}

		} catch (error) {
			this.log({
				type: 'garbage-collection-error',
				message: error.message
			});
		}

		// Do it all over again
		setTimeout(() => {
			this.collectGarbage();
		}, garbagePollInterval);
	}

	log(data) {
		data.date = (new Date()).toISOString();
		const dataString = Object.entries(data).map(([key, value]) => {
			return `${key}="${value}"`;
		}).join(' ');
		this.logger.info(`Ingestion Queue: ${dataString}`);
	}

};
