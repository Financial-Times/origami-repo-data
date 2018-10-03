'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const path = require('path');
const sinon = require('sinon');

describe('lib/service', () => {
	let about;
	let basePath;
	let bookshelf;
	let GitHubClient;
	let healthChecks;
	let IngestionQueueProcessor;
	let knex;
	let morgan;
	let origamiService;
	let requireAll;
	let service;
	let SlackAnnouncer;

	beforeEach(() => {
		basePath = path.resolve(`${__dirname}/../../..`);

		about = {mockAboutInfo: true};
		mockery.registerMock('../about.json', about);

		bookshelf = require('../mock/bookshelf.mock');
		mockery.registerMock('bookshelf', bookshelf);

		GitHubClient = require('../mock/github-client.mock');
		mockery.registerMock('./github-client', GitHubClient);

		healthChecks = require('../mock/health-checks.mock');
		mockery.registerMock('./health-checks', healthChecks);

		IngestionQueueProcessor = require('../mock/ingestion-queue-processor.mock');
		mockery.registerMock('./ingestion-queue-processor', IngestionQueueProcessor);

		knex = require('../mock/knex.mock');
		mockery.registerMock('knex', knex);

		morgan = require('../mock/morgan.mock');
		mockery.registerMock('morgan', morgan);

		origamiService = require('../mock/origami-service.mock');
		mockery.registerMock('@financial-times/origami-service', origamiService);

		requireAll = require('../mock/require-all.mock');
		mockery.registerMock('require-all', requireAll);

		SlackAnnouncer = require('../mock/slack-announcer.mock');
		mockery.registerMock('./slack-announcer', SlackAnnouncer);

		service = require(basePath);
	});

	it('exports a function', () => {
		assert.isFunction(service);
	});

	describe('service(options)', () => {
		let models;
		let options;
		let returnValue;
		let routes;

		beforeEach(() => {
			options = {
				database: 'mock-database-url',
				environment: 'test',
				githubAuthToken: 'mock-github-auth-token',
				port: 1234,
				slackAnnouncerAuthToken: 'mock-slack-auth-token',
				slackAnnouncerChannelId: 'mock-slack-channel-id'
			};
			routes = {
				foo: sinon.spy(),
				bar: sinon.spy()
			};
			requireAll.withArgs(`${basePath}/lib/routes`).returns(routes);
			models = {
				foo: sinon.spy(),
				bar: sinon.spy()
			};
			requireAll.withArgs(`${basePath}/lib/../models`).returns(models);
			returnValue = service(options);
		});

		it('creates an Origami Service application', () => {
			assert.calledOnce(origamiService);
		});

		it('creates a healthChecks object', () => {
			assert.calledOnce(healthChecks);
			assert.calledWithExactly(healthChecks, options);
		});

		it('sets `options.healthCheck` to the created health check function', () => {
			assert.calledOnce(healthChecks.mockHealthChecks.checks);
			assert.strictEqual(options.healthCheck, healthChecks.mockChecksFunction);
		});

		it('sets `options.goodToGoTest` to the created health check gtg function', () => {
			assert.calledOnce(healthChecks.mockHealthChecks.gtg);
			assert.strictEqual(options.goodToGoTest, healthChecks.mockGtgFunction);
		});

		it('sets `options.about` to the contents of about.json', () => {
			assert.strictEqual(options.about, about);
		});

		it('creates a new morgan token named "auth"', () => {
			assert.calledWith(morgan.token.firstCall, 'auth');
			assert.isFunction(morgan.token.firstCall.args[1]);
		});

		describe('morgan "auth" token', () => {
			let authToken;
			let mockRequest;
			let returnValue;

			beforeEach(() => {
				mockRequest = {
					authenticatedKey: {
						get: sinon.stub().returns('mock-auth-value')
					}
				};
				authToken = morgan.token.firstCall.args[1];
				returnValue = authToken(mockRequest, {});
			});

			it('calls the authenticated key `get` method with "id"', () => {
				assert.calledOnce(mockRequest.authenticatedKey.get);
				assert.calledWithExactly(mockRequest.authenticatedKey.get, 'id');
			});

			it('returns the result of the `get` call', () => {
				assert.strictEqual(returnValue, 'mock-auth-value');
			});

			describe('when a third argument (field) is passed in', () => {

				beforeEach(() => {
					mockRequest.authenticatedKey.get.resetHistory();
					returnValue = authToken(mockRequest, {}, 'mock-field');
				});

				it('calls the authenticated key `get` method with the passed in field', () => {
					assert.calledOnce(mockRequest.authenticatedKey.get);
					assert.calledWithExactly(mockRequest.authenticatedKey.get, 'mock-field');
				});

				it('returns the result of the `get` call', () => {
					assert.strictEqual(returnValue, 'mock-auth-value');
				});

			});

			describe('when there is no authenticated key', () => {

				beforeEach(() => {
					delete mockRequest.authenticatedKey;
					returnValue = authToken(mockRequest, {}, 'mock-field');
				});

				it('returns "none"', () => {
					assert.strictEqual(returnValue, 'none');
				});

			});

		});

		it('overrides the morgan token named "url"', () => {
			assert.calledWith(morgan.token.secondCall, 'url');
			assert.isFunction(morgan.token.secondCall.args[1]);
		});

		describe('morgan "url" token', () => {
			let urlToken;
			let mockRequest;
			let returnValue;

			beforeEach(() => {
				mockRequest = {
					originalUrl: '/mock-original-url'
				};
				urlToken = morgan.token.secondCall.args[1];
				returnValue = urlToken(mockRequest);
			});

			it('returns the value of the request `originalUrl` property', () => {
				assert.strictEqual(returnValue, '/mock-original-url');
			});

			describe('when the `originalUrl` property is not set', () => {

				beforeEach(() => {
					mockRequest = {
						url: '/mock-url'
					};
					returnValue = urlToken(mockRequest);
				});

				it('returns the value of the request `url` property', () => {
					assert.strictEqual(returnValue, '/mock-url');
				});

			});

			describe('when the request querystring contains an `apiKey` property', () => {

				beforeEach(() => {
					mockRequest = {
						url: '/mock-url?foo=bar&apiKey=123456&bar=baz'
					};
					returnValue = urlToken(mockRequest);
				});

				it('returns the request URL with that key masked', () => {
					assert.strictEqual(returnValue, '/mock-url?foo=bar&apiKey=XXXXX&bar=baz');
				});

			});

			describe('when the request querystring contains an `apiSecret` property', () => {

				beforeEach(() => {
					mockRequest = {
						url: '/mock-url?foo=bar&apiSecret=123456&bar=baz'
					};
					returnValue = urlToken(mockRequest);
				});

				it('returns the request URL with that key masked', () => {
					assert.strictEqual(returnValue, '/mock-url?foo=bar&apiSecret=XXXXX&bar=baz');
				});

			});

			describe('when the request querystring contains an `apiSecret` property', () => {

				beforeEach(() => {
					mockRequest = {
						url: '/mock-url?foo=bar&apiKey=123456&apiSecret=7890&bar=baz'
					};
					returnValue = urlToken(mockRequest);
				});

				it('returns the request URL with that key masked', () => {
					assert.strictEqual(returnValue, '/mock-url?foo=bar&apiKey=XXXXX&apiSecret=XXXXX&bar=baz');
				});

			});

		});

		it('sets `options.requestLogFormat` to combined plus auth information', () => {
			assert.strictEqual(options.requestLogFormat, `${morgan.combined} auth=":auth/:auth[description]"`);
		});

		describe('when `options.requestLogFormat` is `null`', () => {

			beforeEach(() => {
				options.requestLogFormat = null;
				service(options);
			});

			it('does not alter `options.requestLogFormat`', () => {
				assert.isNull(options.requestLogFormat);
			});

		});

		it('creates and mounts getBasePath middleware', () => {
			assert.calledOnce(origamiService.middleware.getBasePath);
			assert.calledWithExactly(origamiService.middleware.getBasePath);
			assert.calledWith(origamiService.mockApp.use, origamiService.middleware.getBasePath.firstCall.returnValue);
		});

		it('loads all of the routes', () => {
			assert.called(requireAll);
			assert.isObject(requireAll.firstCall.args[0]);
			assert.strictEqual(requireAll.firstCall.args[0].dirname, `${basePath}/lib/routes`);
			assert.isFunction(requireAll.firstCall.args[0].resolve);
		});

		it('calls each route with the Origami Service application', () => {
			const route = sinon.spy();
			requireAll.firstCall.args[0].resolve(route);
			assert.calledOnce(route);
			assert.calledWithExactly(route, origamiService.mockApp);
		});

		it('creates and mounts not found middleware', () => {
			assert.calledOnce(origamiService.middleware.notFound);
			assert.calledWithExactly(origamiService.middleware.notFound);
			assert.calledWith(origamiService.mockApp.use, origamiService.middleware.notFound.firstCall.returnValue);
		});

		it('creates and mounts error handling middleware', () => {
			assert.calledOnce(origamiService.middleware.errorHandler);
			assert.calledWithExactly(origamiService.middleware.errorHandler, {
				outputJson: true
			});
			assert.calledWith(origamiService.mockApp.use, origamiService.middleware.errorHandler.firstCall.returnValue);
		});

		it('creates a Knex instance', () => {
			assert.calledOnce(knex);
			assert.calledWith(knex, {
				client: 'pg',
				connection: options.database
			});
		});

		it('creates a Bookshelf instance using the created Knex instance', () => {
			assert.calledOnce(bookshelf);
			assert.calledWithExactly(bookshelf, knex.mockInstance);
		});

		it('mounts the "virtuals" Bookshelf plugin', () => {
			assert.calledWithExactly(bookshelf.mockInstance.plugin, 'virtuals');
		});

		it('stores the created Bookshelf instance on `app.database`', () => {
			assert.strictEqual(origamiService.mockApp.database, bookshelf.mockInstance);
		});

		it('sets `app.model` to an empty object', () => {
			assert.isObject(origamiService.mockApp.model);
			assert.deepEqual(origamiService.mockApp.model, {});
		});

		it('loads all of the models', () => {
			assert.called(requireAll);
			assert.isObject(requireAll.secondCall.args[0]);
			assert.strictEqual(requireAll.secondCall.args[0].dirname, `${basePath}/lib/../models`);
			assert.isFunction(requireAll.secondCall.args[0].resolve);
		});

		it('calls each model with the Origami Service application', () => {
			const model = sinon.spy();
			requireAll.secondCall.args[0].resolve(model);
			assert.calledOnce(model);
			assert.calledWithExactly(model, origamiService.mockApp);
		});

		it('creates a Slack announcer and stores it on the application', () => {
			assert.calledOnce(SlackAnnouncer);
			assert.calledWithExactly(SlackAnnouncer, {
				authToken: options.slackAnnouncerAuthToken,
				channelId: options.slackAnnouncerChannelId,
				log: origamiService.mockApp.ft.log
			});
			assert.calledWithNew(SlackAnnouncer);
			assert.strictEqual(origamiService.mockApp.slackAnnouncer, SlackAnnouncer.mockSlackAnnouncer);
		});

		it('creates an ingestion queue processor and stores it on the application', () => {
			assert.calledOnce(IngestionQueueProcessor);
			assert.calledWithExactly(IngestionQueueProcessor, origamiService.mockApp);
			assert.calledWithNew(IngestionQueueProcessor);
			assert.strictEqual(origamiService.mockApp.ingestionQueueProcessor, IngestionQueueProcessor.mockIngestionQueueProcessor);
		});

		it('starts the created ingestion queue processor', () => {
			assert.calledOnce(IngestionQueueProcessor.mockIngestionQueueProcessor.start);
		});

		describe('when `options.disableIngestionQueue` is `true`', () => {

			beforeEach(() => {
				IngestionQueueProcessor.mockIngestionQueueProcessor.start.reset();
				options.disableIngestionQueue = true;
				service(options);
			});

			it('does not start the ingestionQueueProcessor', () => {
				assert.notCalled(IngestionQueueProcessor.mockIngestionQueueProcessor.start);
			});

		});

		it('creates a GitHub client and stores it on the application', () => {
			assert.calledOnce(GitHubClient);
			assert.calledWithExactly(GitHubClient, 'mock-github-auth-token');
			assert.calledWithNew(GitHubClient);
			assert.strictEqual(origamiService.mockApp.github, GitHubClient.mockGitHubClient);
		});

		it('returns the created application', () => {
			assert.strictEqual(returnValue, origamiService.mockApp);
		});

	});

});
