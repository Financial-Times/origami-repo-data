'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const path = require('path');
const sinon = require('sinon');

describe('lib/service', () => {
	let about;
	let basePath;
	let bookshelf;
	let healthChecks;
	let knex;
	let morgan;
	let service;
	let origamiService;
	let requireAll;

	beforeEach(() => {
		basePath = path.resolve(`${__dirname}/../../..`);

		about = {mockAboutInfo: true};
		mockery.registerMock('../about.json', about);

		bookshelf = require('../mock/bookshelf.mock');
		mockery.registerMock('bookshelf', bookshelf);

		healthChecks = require('../mock/health-checks.mock');
		mockery.registerMock('./health-checks', healthChecks);

		knex = require('../mock/knex.mock');
		mockery.registerMock('knex', knex);

		morgan = require('../mock/morgan.mock');
		mockery.registerMock('morgan', morgan);

		origamiService = require('../mock/origami-service.mock');
		mockery.registerMock('@financial-times/origami-service', origamiService);

		requireAll = require('../mock/require-all.mock');
		mockery.registerMock('require-all', requireAll);

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
				port: 1234
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
			assert.calledOnce(morgan.token);
			assert.calledWith(morgan.token, 'auth');
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

		it('sets `options.requestLogFormat` to combined plus auth information', () => {
			assert.strictEqual(options.requestLogFormat, `${morgan.combined} auth=":auth/:auth[description]"`);
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
			assert.calledWithExactly(origamiService.middleware.errorHandler);
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

		it('returns the created application', () => {
			assert.strictEqual(returnValue, origamiService.mockApp);
		});

	});

});
