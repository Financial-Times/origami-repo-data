'use strict';

const idlePollInterval = (30 * 1000); // 30 seconds

module.exports = class IngestionQueueProcessor {

	constructor(app) {
		this.app = app;
		this.logger = app.origami.options.log;
		this.Ingestion = app.model.Ingestion;
		this.Version = app.model.Version;
	}

	async start() {
		this.fetchNextIngestion();
	}

	async fetchNextIngestion() {
		let ingestion;
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
				return setTimeout(() => {
					this.fetchNextIngestion();
				}, idlePollInterval);
			}
		} catch (error) {
			const log = {
				type: 'error',
				message: error.message
			};
			if (ingestion) {
				log.url = ingestion.get('url');
				log.tag = ingestion.get('tag');

				ingestion.set('ingestion_attempts', ingestion.get('ingestion_attempts') + 1);
				ingestion.set('ingestion_started_at', null);

				await ingestion.save();
			}
			this.log(log);
		}

		// Do it all over again
		setTimeout(() => {
			this.fetchNextIngestion();
		}, 100);
	}

	log(data) {
		data.date = (new Date()).toISOString();
		const dataString = Object.entries(data).map(([key, value]) => {
			return `${key}="${value}"`;
		}).join(' ');
		this.logger.info(`Ingestion Queue: ${dataString}`);
	}

};
