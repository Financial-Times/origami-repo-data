'use strict';

const assert = require('proclaim');
const sinon = require('sinon');

describe('lib/ingestion-queue-processor', () => {
	let app;
	let IngestionQueueProcessor;
	let mockIngestion;
	let mockVersion;

	beforeEach(() => {
		app = require('../mock/origami-service.mock').mockApp;
		mockIngestion = {
			destroy: sinon.stub().resolves(),
			get: sinon.stub(),
			save: sinon.stub().resolves(),
			set: sinon.stub()
		};
		mockVersion = {
			get: sinon.stub()
		};
		app.model = {
			Ingestion: {
				fetchLatestAndMarkAsRunning: sinon.stub().resolves(mockIngestion)
			},
			Version: {
				createFromIngestion: sinon.stub().resolves(mockVersion)
			}
		};

		IngestionQueueProcessor = require('../../../lib/ingestion-queue-processor');
	});

	it('exports a class constructor', () => {
		assert.isFunction(IngestionQueueProcessor);
		assert.throws(() => IngestionQueueProcessor(), /constructor ingestionqueueprocessor/i); // eslint-disable-line new-cap
	});

	describe('new IngestionQueueProcessor(app)', () => {
		let instance;

		beforeEach(() => {
			instance = new IngestionQueueProcessor(app);
		});

		it('has an `app` property set to passed in app', () => {
			assert.strictEqual(instance.app, app);
		});

		it('has a `logger` property set to the application logger', () => {
			assert.strictEqual(instance.logger, app.origami.options.log);
		});

		it('has an `Ingestion` property set to the Ingestion model', () => {
			assert.strictEqual(instance.Ingestion, app.model.Ingestion);
		});

		it('has a `Version` property set to the Version model', () => {
			assert.strictEqual(instance.Version, app.model.Version);
		});

		describe('.start()', () => {

			beforeEach(() => {
				instance.fetchNextIngestion = sinon.spy();
				instance.start();
			});

			it('calls the `fetchNextIngestion` method', () => {
				assert.calledOnce(instance.fetchNextIngestion);
				assert.calledWithExactly(instance.fetchNextIngestion);
			});

		});

		describe('.fetchNextIngestion()', () => {
			let fetchNextIngestion;

			beforeEach(async () => {
				sinon.stub(global, 'setTimeout');

				mockIngestion.get.withArgs('url').returns('mock-ingestion-url');
				mockIngestion.get.withArgs('tag').returns('mock-ingestion-tag');
				mockVersion.get.withArgs('id').returns('mock-version-id');
				instance.log = sinon.spy();

				// We need to grab the function and then mock it because otherwise
				// it will recurse infinitely
				fetchNextIngestion = instance.fetchNextIngestion.bind(instance);
				instance.fetchNextIngestion = sinon.spy();

				await fetchNextIngestion();
			});

			afterEach(() => {
				global.setTimeout.restore();
			});

			it('fetches the next ingestion from the database', () => {
				assert.calledOnce(instance.Ingestion.fetchLatestAndMarkAsRunning);
				assert.calledWithExactly(instance.Ingestion.fetchLatestAndMarkAsRunning);
			});

			it('logs an attempt', () => {
				assert.calledWith(instance.log, {
					type: 'attempt',
					url: 'mock-ingestion-url',
					tag: 'mock-ingestion-tag'
				});
			});

			it('creates a new version based on the ingestion', () => {
				assert.calledOnce(instance.Version.createFromIngestion);
				assert.calledWithExactly(instance.Version.createFromIngestion, mockIngestion);
			});

			it('logs the version creation', () => {
				assert.calledWith(instance.log, {
					type: 'success',
					url: 'mock-ingestion-url',
					tag: 'mock-ingestion-tag',
					version: 'mock-version-id'
				});
			});

			it('destroys the successful ingestion', () => {
				assert.calledOnce(mockIngestion.destroy);
			});

			it('sets a timeout to recurse', () => {
				assert.calledOnce(global.setTimeout);
				assert.isFunction(global.setTimeout.firstCall.args[0]);
				assert.strictEqual(global.setTimeout.firstCall.args[1], 100);
				global.setTimeout.firstCall.args[0]();
				assert.calledOnce(instance.fetchNextIngestion);
				assert.calledWithExactly(instance.fetchNextIngestion);
			});

			describe('when no ingestions are in the database', () => {

				beforeEach(async () => {
					global.setTimeout.resetHistory();
					instance.Ingestion.fetchLatestAndMarkAsRunning.resetHistory();
					instance.Ingestion.fetchLatestAndMarkAsRunning.resolves(null);
					instance.Version.createFromIngestion.resetHistory();
					instance.fetchNextIngestion.reset();
					await fetchNextIngestion();
				});

				it('attempts to fetch the next ingestion from the database', () => {
					assert.calledOnce(instance.Ingestion.fetchLatestAndMarkAsRunning);
					assert.calledWithExactly(instance.Ingestion.fetchLatestAndMarkAsRunning);
				});

				it('does not create a new version', () => {
					assert.notCalled(instance.Version.createFromIngestion);
				});

				it('does not recurse immediately', () => {
					assert.notCalled(instance.fetchNextIngestion);
				});

				it('sets a timeout to recurse later', () => {
					assert.calledOnce(global.setTimeout);
					assert.isFunction(global.setTimeout.firstCall.args[0]);
					assert.strictEqual(global.setTimeout.firstCall.args[1], 30000);
					global.setTimeout.firstCall.args[0]();
					assert.calledOnce(instance.fetchNextIngestion);
					assert.calledWithExactly(instance.fetchNextIngestion);
				});

			});

			describe('when the version creation fails', () => {
				let creationError;

				beforeEach(async () => {
					global.setTimeout.resetHistory();
					creationError = new Error('mock creation error');
					instance.Version.createFromIngestion.resetHistory();
					instance.Version.createFromIngestion.rejects(creationError);
					instance.fetchNextIngestion.reset();
					mockIngestion.get.withArgs('ingestion_attempts').returns(1);
					await fetchNextIngestion();
				});

				it('logs the failure', () => {
					assert.calledWith(instance.log, {
						type: 'error',
						message: 'mock creation error',
						url: 'mock-ingestion-url',
						tag: 'mock-ingestion-tag'
					});
				});

				it('increments the ingestion attempts', () => {
					assert.calledWithExactly(mockIngestion.set, 'ingestion_attempts', 2);
				});

				it('nullifies the ingestion start date', () => {
					assert.calledWithExactly(mockIngestion.set, 'ingestion_started_at', null);
				});

				it('saves the ingestion', () => {
					assert.calledOnce(mockIngestion.save);
					assert.calledWithExactly(mockIngestion.save);
				});

				it('sets a timeout to recurse', () => {
					assert.calledOnce(global.setTimeout);
					assert.isFunction(global.setTimeout.firstCall.args[0]);
					assert.strictEqual(global.setTimeout.firstCall.args[1], 100);
					global.setTimeout.firstCall.args[0]();
					assert.calledOnce(instance.fetchNextIngestion);
					assert.calledWithExactly(instance.fetchNextIngestion);
				});

			});

			describe('when the ingestion fetch fails', () => {
				let fetchError;

				beforeEach(async () => {
					global.setTimeout.resetHistory();
					fetchError = new Error('mock fetch error');
					instance.Ingestion.fetchLatestAndMarkAsRunning.resetHistory();
					instance.Ingestion.fetchLatestAndMarkAsRunning.rejects(fetchError);
					instance.fetchNextIngestion.reset();
					await fetchNextIngestion();
				});

				it('logs the failure', () => {
					assert.calledWith(instance.log, {
						type: 'error',
						message: 'mock fetch error'
					});
				});

				it('sets a timeout to recurse', () => {
					assert.calledOnce(global.setTimeout);
					assert.isFunction(global.setTimeout.firstCall.args[0]);
					assert.strictEqual(global.setTimeout.firstCall.args[1], 100);
					global.setTimeout.firstCall.args[0]();
					assert.calledOnce(instance.fetchNextIngestion);
					assert.calledWithExactly(instance.fetchNextIngestion);
				});

			});

		});

		describe('.log(data)', () => {

			beforeEach(() => {
				sinon.stub(global, 'Date').returns({
					toISOString: sinon.stub().returns('mock iso string')
				});
				instance.log({
					mockKey1: 'mock-value-1',
					mockKey2: 'mock-value-2'
				});
			});

			afterEach(() => {
				global.Date.restore();
			});

			it('logs a prefixed message with the data serialised into a string', () => {
				assert.calledOnce(instance.logger.info);
				assert.calledWithExactly(instance.logger.info, 'Ingestion Queue: mockKey1="mock-value-1" mockKey2="mock-value-2" date="mock iso string"');
			});

		});

	});

});
