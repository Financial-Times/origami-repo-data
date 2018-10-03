'use strict';

const idlePollInterval = (30 * 1000); // 30 seconds
const garbagePollInterval = (15 * 60 * 1000); // 15 minutes

module.exports = class IngestionQueueProcessor {

	constructor(app) {
		this.app = app;
		this.logger = app.ft.options.log;
		this.Ingestion = app.model.Ingestion;
		this.Version = app.model.Version;
	}

	async start() {
		this.fetchNextIngestion();
		this.collectGarbage();
	}

	async fetchNextIngestion() {
		let ingestion;
		let pollInterval = 100;
		try {
			ingestion = await this.Ingestion.fetchLatestAndMarkAsRunning();

			// We have an ingestion, we can process it now
			if (ingestion) {
				this.log({
					type: 'attempt',
					url: ingestion.get('url'),
					tag: ingestion.get('tag')
				});

				// Attempt to create a new version from the ingestion
				const version = await this.Version.createFromIngestion(ingestion);
				this.log({
					type: 'success',
					url: ingestion.get('url'),
					tag: ingestion.get('tag'),
					version: version.get('id')
				});

				// Destroy the completed ingestion
				await ingestion.destroy();

			// No more ingestions found, we just set a timer
			// to poll for more soon (and return)
			} else {
				pollInterval = idlePollInterval;
			}
		} catch (error) {
			const log = {
				type: 'error',
				message: error.message,
				recoverable: Boolean(error.isRecoverable)
			};
			if (ingestion) {
				log.url = ingestion.get('url');
				log.tag = ingestion.get('tag');

				if (error.isRecoverable === false) {
					await ingestion.destroy();
				} else {
					ingestion.set('ingestion_attempts', ingestion.get('ingestion_attempts') + 1);
					ingestion.set('ingestion_started_at', null);
					await ingestion.save();
				}
			}
			this.log(log);

			// Set a longer wait time if we've hit the GitHub rate limit
			if (error.code === 403 && error.headers && error.headers['x-ratelimit-reset']) {
				const waitTime = (Number(error.headers['x-ratelimit-reset']) * 1000) - Date.now();
				this.log({
					type: 'rate-limit-wait',
					time: waitTime,
					rateLimitReset: (new Date(Number(error.headers['x-ratelimit-reset']) * 1000)).toISOString()
				});
				pollInterval = waitTime;
			}
		}

		// Do it all over again
		setTimeout(() => {
			this.fetchNextIngestion();
		}, pollInterval);
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
