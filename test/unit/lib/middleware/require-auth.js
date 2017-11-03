'use strict';

const assert = require('proclaim');
const sinon = require('sinon');

describe('lib/middleware/require-auth', () => {
	let mockKey;
	let origamiService;
	let requireAuth;

	beforeEach(() => {
		origamiService = require('../../mock/origami-service.mock');

		mockKey = {
			get: sinon.stub().returns(true)
		};
		origamiService.mockApp.model = {
			Key: {
				fetchByKey: sinon.stub().resolves(mockKey)
			}
		};

		requireAuth = require('../../../../lib/middleware/require-auth');
	});

	it('exports a function', () => {
		assert.isFunction(requireAuth);
	});

	it('has a `READ` property', () => {
		assert.isTypeOf(requireAuth.READ, 'symbol');
	});

	it('has a `WRITE` property', () => {
		assert.isTypeOf(requireAuth.WRITE, 'symbol');
	});

	it('has a `ADMIN` property', () => {
		assert.isTypeOf(requireAuth.ADMIN, 'symbol');
	});

	describe('requireAuth(level)', () => {

		it('returns a middleware function', () => {
			assert.isFunction(requireAuth(requireAuth.READ));
		});

		describe('middleware(request, response, next)', () => {
			let middleware;

			beforeEach(() => {
				middleware = requireAuth(requireAuth.READ);
			});

			describe('when a valid "X-Api-Key" header is set', () => {
				let caughtError;

				beforeEach(done => {
					origamiService.mockRequest.headers['x-api-key'] = 'mock-api-key';
					middleware(origamiService.mockRequest, origamiService.mockResponse, error => {
						caughtError = error;
						done();
					});
				});

				it('fetches a key from the database', () => {
					assert.calledOnce(origamiService.mockApp.model.Key.fetchByKey);
					assert.calledWithExactly(origamiService.mockApp.model.Key.fetchByKey, 'mock-api-key');
				});

				it('gets the returned key permission that corresponds to `level`', () => {
					assert.calledOnce(mockKey.get);
					assert.calledWithExactly(mockKey.get, 'read');
				});

				it('calls `next` with no error', () => {
					assert.isUndefined(caughtError);
				});

			});

			describe('when a valid "apiKey" query parameter is set', () => {
				let caughtError;

				beforeEach(done => {
					origamiService.mockRequest.query.apiKey = 'mock-api-key';
					middleware(origamiService.mockRequest, origamiService.mockResponse, error => {
						caughtError = error;
						done();
					});
				});

				it('fetches a key from the database', () => {
					assert.calledOnce(origamiService.mockApp.model.Key.fetchByKey);
					assert.calledWithExactly(origamiService.mockApp.model.Key.fetchByKey, 'mock-api-key');
				});

				it('gets the returned key permission that corresponds to `level`', () => {
					assert.calledOnce(mockKey.get);
					assert.calledWithExactly(mockKey.get, 'read');
				});

				it('calls `next` with no error', () => {
					assert.isUndefined(caughtError);
				});

			});

			describe('when an API key is not provided', () => {
				let caughtError;

				beforeEach(done => {
					middleware(origamiService.mockRequest, origamiService.mockResponse, error => {
						caughtError = error;
						done();
					});
				});

				it('does not fetch a key from the database', () => {
					assert.notCalled(origamiService.mockApp.model.Key.fetchByKey);
				});

				it('calls `next` with a 401 error', () => {
					assert.instanceOf(caughtError, Error);
					assert.strictEqual(caughtError.status, 401);
				});

			});

			describe('when an invalid "X-Api-Key" header is set', () => {
				let caughtError;

				beforeEach(done => {
					origamiService.mockApp.model.Key.fetchByKey.resolves();
					origamiService.mockRequest.headers['x-api-key'] = 'mock-api-key';
					middleware(origamiService.mockRequest, origamiService.mockResponse, error => {
						caughtError = error;
						done();
					});
				});

				it('attempts to fetch a key from the database', () => {
					assert.calledOnce(origamiService.mockApp.model.Key.fetchByKey);
					assert.calledWithExactly(origamiService.mockApp.model.Key.fetchByKey, 'mock-api-key');
				});

				it('calls `next` with a 401 error', () => {
					assert.instanceOf(caughtError, Error);
					assert.strictEqual(caughtError.status, 401);
				});

			});

			describe('when the key doesn\'t have the permission required by `level`', () => {
				let caughtError;

				beforeEach(done => {
					mockKey.get.returns(false);
					origamiService.mockRequest.headers['x-api-key'] = 'mock-api-key';
					middleware(origamiService.mockRequest, origamiService.mockResponse, error => {
						caughtError = error;
						done();
					});
				});

				it('fetches a key from the database', () => {
					assert.calledOnce(origamiService.mockApp.model.Key.fetchByKey);
					assert.calledWithExactly(origamiService.mockApp.model.Key.fetchByKey, 'mock-api-key');
				});

				it('gets the returned key permission that corresponds to `level`', () => {
					assert.calledOnce(mockKey.get);
					assert.calledWithExactly(mockKey.get, 'read');
				});

				it('calls `next` with a 403 error', () => {
					assert.instanceOf(caughtError, Error);
					assert.strictEqual(caughtError.status, 403);
				});

			});

		});

		describe('when `level` is `requireAuth.READ`', () => {

			describe('middleware(request, response, next)', () => {

				beforeEach(done => {
					origamiService.mockRequest.headers['x-api-key'] = 'mock-api-key';
					requireAuth(requireAuth.READ)(origamiService.mockRequest, origamiService.mockResponse, done);
				});

				it('gets the returned key "read" permission', () => {
					assert.calledOnce(mockKey.get);
					assert.calledWithExactly(mockKey.get, 'read');
				});

			});

		});

		describe('when `level` is `requireAuth.WRITE`', () => {

			describe('middleware(request, response, next)', () => {

				beforeEach(done => {
					origamiService.mockRequest.headers['x-api-key'] = 'mock-api-key';
					requireAuth(requireAuth.WRITE)(origamiService.mockRequest, origamiService.mockResponse, done);
				});

				it('gets the returned key "write" permission', () => {
					assert.calledOnce(mockKey.get);
					assert.calledWithExactly(mockKey.get, 'write');
				});

			});

		});

		describe('when `level` is `requireAuth.ADMIN`', () => {

			describe('middleware(request, response, next)', () => {

				beforeEach(done => {
					origamiService.mockRequest.headers['x-api-key'] = 'mock-api-key';
					requireAuth(requireAuth.ADMIN)(origamiService.mockRequest, origamiService.mockResponse, done);
				});

				it('gets the returned key "admin" permission', () => {
					assert.calledOnce(mockKey.get);
					assert.calledWithExactly(mockKey.get, 'admin');
				});

			});

		});

		describe('when `level` is invalid', () => {

			it('throws an error', () => {
				assert.throws(() => {
					requireAuth('not-valid');
				}, /level is required, and must be one of the permission level symbols/i);
			});

		});

	});

});
