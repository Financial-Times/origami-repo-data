'use strict';

const assert = require('proclaim');
const sinon = require('sinon');

describe('lib/ingestion-queue-processor', () => {
	let app;
	let IngestionQueueProcessor;
	let mockIngestion;
	let mockIngestionOverAttempted;
	let mockIngestionOverRunning;
	let mockVersion;

	beforeEach(() => {
		app = require('../mock/origami-service.mock').mockApp;
		mockIngestion = {
			destroy: sinon.stub().resolves(),
			get: sinon.stub(),
			save: sinon.stub().resolves(),
			set: sinon.stub()
		};
		mockIngestionOverAttempted = {
			destroy: sinon.stub().resolves(),
			get: sinon.stub()
		};
		mockIngestionOverRunning = {
			get: sinon.stub(),
			save: sinon.stub().resolves(),
			set: sinon.stub()
		};
		mockVersion = {
			get: sinon.stub()
		};
		app.model = {
			Ingestion: {
				fetchLatestAndMarkAsRunning: sinon.stub().resolves(mockIngestion),
				fetchOverAttempted: sinon.stub().resolves({
					toArray: sinon.stub().returns([mockIngestionOverAttempted])
				}),
				fetchOverRunning: sinon.stub().resolves({
					toArray: sinon.stub().returns([mockIngestionOverRunning])
				})
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
				instance.collectGarbage = sinon.spy();
				instance.start();
			});

			it('calls the `fetchNextIngestion` method', () => {
				assert.calledOnce(instance.fetchNextIngestion);
				assert.calledWithExactly(instance.fetchNextIngestion);
			});

			it('calls the `collectGarbage` method', () => {
				assert.calledOnce(instance.collectGarbage);
				assert.calledWithExactly(instance.collectGarbage);
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
						tag: 'mock-ingestion-tag',
						recoverable: false
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

			describe('when the version creation fails but is recoverable', () => {
				let creationError;

				beforeEach(async () => {
					creationError = new Error('mock creation error');
					creationError.isRecoverable = true;
					instance.Version.createFromIngestion.resetHistory();
					instance.Version.createFromIngestion.rejects(creationError);
					await fetchNextIngestion();
				});

				it('logs the failure', () => {
					assert.calledWith(instance.log, {
						type: 'error',
						message: 'mock creation error',
						url: 'mock-ingestion-url',
						tag: 'mock-ingestion-tag',
						recoverable: true
					});
				});

			});

			describe('when the version creation fails and it is explicitly not recoverable', () => {
				let creationError;

				beforeEach(async () => {
					creationError = new Error('mock creation error');
					creationError.isRecoverable = false;
					instance.Version.createFromIngestion.resetHistory();
					instance.Version.createFromIngestion.rejects(creationError);
					mockIngestion.set.resetHistory();
					mockIngestion.destroy.resetHistory();
					await fetchNextIngestion();
				});

				it('does not increment the ingestion attempts', () => {
					assert.neverCalledWith(mockIngestion.set, 'ingestion_attempts', 2);
				});

				it('does not nullify the ingestion start date', () => {
					assert.neverCalledWith(mockIngestion.set, 'ingestion_started_at', null);
				});

				it('destroys the ingestion', () => {
					assert.calledOnce(mockIngestion.destroy);
					assert.calledWithExactly(mockIngestion.destroy);
				});

			});

			describe('when the version creation fails due to a GitHub rate limit error', () => {
				let rateLimitError;
				let expectedWaitDate;
				let expectedWaitTime;

				beforeEach(async () => {
					sinon.stub(global.Date, 'now').returns(570189600000); // 1988-01-26T10:00:00.000Z
					expectedWaitTime = 3600000; // Date.now minus the rate limit reset time
					expectedWaitDate = '1988-01-26T11:00:00.000Z'; // Date.now plus wait time as an ISO string

					rateLimitError = new Error('mock creation error');
					rateLimitError.code = 403;
					rateLimitError.headers = {
						'x-ratelimit-reset': '570193200'
					};

					instance.Version.createFromIngestion.resetHistory();
					instance.Version.createFromIngestion.rejects(rateLimitError);
					global.setTimeout.resetHistory();
					await fetchNextIngestion();
				});

				afterEach(() => {
					global.Date.now.restore();
				});

				it('logs the wait time', () => {
					assert.calledWith(instance.log, {
						type: 'rate-limit-wait',
						time: expectedWaitTime,
						rateLimitReset: expectedWaitDate
					});
				});

				it('sets a timeout to recurse that matches the rate limit reset time', () => {
					assert.calledOnce(global.setTimeout);
					assert.isFunction(global.setTimeout.firstCall.args[0]);
					assert.strictEqual(global.setTimeout.firstCall.args[1], expectedWaitTime);
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
						message: 'mock fetch error',
						recoverable: false
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

		describe('.collectGarbage()', () => {
			let collectGarbage;

			beforeEach(async () => {
				sinon.stub(global, 'setTimeout');

				mockIngestionOverAttempted.get.withArgs('url').returns('mock-over-attempted-ingestion-url');
				mockIngestionOverAttempted.get.withArgs('tag').returns('mock-over-attempted-ingestion-tag');
				mockIngestionOverRunning.get.withArgs('url').returns('mock-over-running-ingestion-url');
				mockIngestionOverRunning.get.withArgs('tag').returns('mock-over-running-ingestion-tag');
				instance.log = sinon.spy();

				// We need to grab the function and then mock it because otherwise
				// it will recurse infinitely
				collectGarbage = instance.collectGarbage.bind(instance);
				instance.collectGarbage = sinon.spy();

				await collectGarbage();
			});

			afterEach(() => {
				global.setTimeout.restore();
			});

			it('fetches over-attempted ingestions from the database', () => {
				assert.calledOnce(instance.Ingestion.fetchOverAttempted);
				assert.calledWithExactly(instance.Ingestion.fetchOverAttempted);
			});

			it('logs the garbage collection of each over-attempted ingestion', () => {
				assert.calledWith(instance.log, {
					type: 'garbage-collection',
					message: 'Ingestion attempted too many times',
					url: 'mock-over-attempted-ingestion-url',
					tag: 'mock-over-attempted-ingestion-tag'
				});
			});

			it('destroys all over-attempted ingestions', () => {
				assert.calledOnce(mockIngestionOverAttempted.destroy);
				assert.calledWithExactly(mockIngestionOverAttempted.destroy);
			});

			it('fetches over-running ingestions from the database', () => {
				assert.calledOnce(instance.Ingestion.fetchOverRunning);
				assert.calledWithExactly(instance.Ingestion.fetchOverRunning);
			});

			it('logs the garbage collection of each over-running ingestion', () => {
				assert.calledWith(instance.log, {
					type: 'garbage-collection',
					message: 'Ingestion ran for too long',
					url: 'mock-over-running-ingestion-url',
					tag: 'mock-over-running-ingestion-tag'
				});
			});

			it('resets all over-attempted ingestion start times and saves them', () => {
				assert.calledOnce(mockIngestionOverRunning.set);
				assert.calledWithExactly(mockIngestionOverRunning.set, 'ingestion_started_at', null);
				assert.calledOnce(mockIngestionOverRunning.save);
				assert.calledWithExactly(mockIngestionOverRunning.save);
			});

			it('sets a timeout to recurse', () => {
				assert.calledOnce(global.setTimeout);
				assert.isFunction(global.setTimeout.firstCall.args[0]);
				assert.strictEqual(global.setTimeout.firstCall.args[1], 900000);
				global.setTimeout.firstCall.args[0]();
				assert.calledOnce(instance.collectGarbage);
				assert.calledWithExactly(instance.collectGarbage);
			});

			describe('when something fails', () => {
				let fetchError;

				beforeEach(async () => {
					global.setTimeout.resetHistory();
					fetchError = new Error('mock fetch error');
					instance.Ingestion.fetchOverAttempted.resetHistory();
					instance.Ingestion.fetchOverAttempted.rejects(fetchError);
					instance.collectGarbage.reset();
					await collectGarbage();
				});

				it('logs the failure', () => {
					assert.calledWith(instance.log, {
						type: 'garbage-collection-error',
						message: 'mock fetch error'
					});
				});

				it('sets a timeout to recurse', () => {
					assert.calledOnce(global.setTimeout);
					assert.isFunction(global.setTimeout.firstCall.args[0]);
					assert.strictEqual(global.setTimeout.firstCall.args[1], 900000);
					global.setTimeout.firstCall.args[0]();
					assert.calledOnce(instance.collectGarbage);
					assert.calledWithExactly(instance.collectGarbage);
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
