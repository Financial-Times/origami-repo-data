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
			get: sinon.stub()
		};
		mockKey.get.withArgs('secret').returns('mock-hashed-secret');
		mockKey.get.withArgs('read').returns(true);
		mockKey.get.withArgs('write').returns(true);
		mockKey.get.withArgs('admin').returns(true);
		origamiService.mockApp.model = {
			Key: {
				compare: sinon.stub().resolves(true),
				fetchById: sinon.stub().resolves(mockKey)
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

			describe('when valid "X-Api-Key" and "X-Api-Secret" headers are set', () => {
				let caughtError;

				beforeEach(done => {
					origamiService.mockRequest.headers['x-api-key'] = 'mock-api-key';
					origamiService.mockRequest.headers['x-api-secret'] = 'mock-api-secret';
					middleware(origamiService.mockRequest, origamiService.mockResponse, error => {
						caughtError = error;
						done();
					});
				});

				it('fetches a key from the database', () => {
					assert.calledOnce(origamiService.mockApp.model.Key.fetchById);
					assert.calledWithExactly(origamiService.mockApp.model.Key.fetchById, 'mock-api-key');
				});

				it('compares the provided secret with the stored hash', () => {
					assert.calledOnce(origamiService.mockApp.model.Key.compare);
					assert.calledWithExactly(origamiService.mockApp.model.Key.compare, 'mock-api-secret', 'mock-hashed-secret');
				});

				it('gets the returned key permission that corresponds to `level`', () => {
					assert.called(mockKey.get);
					assert.calledWithExactly(mockKey.get, 'read');
				});

				it('calls `next` with no error', () => {
					assert.isUndefined(caughtError);
				});

			});

			describe('when valid "apiKey" and "apiSecret" query parameter are set', () => {
				let caughtError;

				beforeEach(done => {
					origamiService.mockRequest.query.apiKey = 'mock-api-key';
					origamiService.mockRequest.query.apiSecret = 'mock-api-secret';
					middleware(origamiService.mockRequest, origamiService.mockResponse, error => {
						caughtError = error;
						done();
					});
				});

				it('fetches a key from the database', () => {
					assert.calledOnce(origamiService.mockApp.model.Key.fetchById);
					assert.calledWithExactly(origamiService.mockApp.model.Key.fetchById, 'mock-api-key');
				});

				it('compares the provided secret with the stored hash', () => {
					assert.calledOnce(origamiService.mockApp.model.Key.compare);
					assert.calledWithExactly(origamiService.mockApp.model.Key.compare, 'mock-api-secret', 'mock-hashed-secret');
				});

				it('gets the returned key permission that corresponds to `level`', () => {
					assert.called(mockKey.get);
					assert.calledWithExactly(mockKey.get, 'read');
				});

				it('calls `next` with no error', () => {
					assert.isUndefined(caughtError);
				});

			});

			describe('when API credentials are not provided', () => {
				let caughtError;

				beforeEach(done => {
					middleware(origamiService.mockRequest, origamiService.mockResponse, error => {
						caughtError = error;
						done();
					});
				});

				it('does not fetch a key from the database', () => {
					assert.notCalled(origamiService.mockApp.model.Key.fetchById);
				});

				it('calls `next` with a 401 error', () => {
					assert.instanceOf(caughtError, Error);
					assert.strictEqual(caughtError.status, 401);
				});

			});

			describe('when an invalid "X-Api-Key" header is set', () => {
				let caughtError;

				beforeEach(done => {
					origamiService.mockApp.model.Key.fetchById.resolves();
					origamiService.mockRequest.headers['x-api-key'] = 'mock-api-key';
					origamiService.mockRequest.headers['x-api-secret'] = 'mock-api-secret';
					middleware(origamiService.mockRequest, origamiService.mockResponse, error => {
						caughtError = error;
						done();
					});
				});

				it('attempts to fetch a key from the database', () => {
					assert.calledOnce(origamiService.mockApp.model.Key.fetchById);
					assert.calledWithExactly(origamiService.mockApp.model.Key.fetchById, 'mock-api-key');
				});

				it('calls `next` with a 401 error', () => {
					assert.instanceOf(caughtError, Error);
					assert.strictEqual(caughtError.status, 401);
				});

			});

			describe('when an invalid "X-Api-Secret" header is set', () => {
				let caughtError;

				beforeEach(done => {
					origamiService.mockApp.model.Key.compare.resolves(false);
					origamiService.mockRequest.headers['x-api-key'] = 'mock-api-key';
					origamiService.mockRequest.headers['x-api-secret'] = 'mock-api-secret';
					middleware(origamiService.mockRequest, origamiService.mockResponse, error => {
						caughtError = error;
						done();
					});
				});

				it('fetches a key from the database', () => {
					assert.calledOnce(origamiService.mockApp.model.Key.fetchById);
					assert.calledWithExactly(origamiService.mockApp.model.Key.fetchById, 'mock-api-key');
				});

				it('compares the provided secret with the stored hash', () => {
					assert.calledOnce(origamiService.mockApp.model.Key.compare);
					assert.calledWithExactly(origamiService.mockApp.model.Key.compare, 'mock-api-secret', 'mock-hashed-secret');
				});

				it('calls `next` with a 401 error', () => {
					assert.instanceOf(caughtError, Error);
					assert.strictEqual(caughtError.status, 401);
				});

			});

			describe('when the key doesn\'t have the permission required by `level`', () => {
				let caughtError;

				beforeEach(done => {
					mockKey.get.withArgs('read').returns(false);
					origamiService.mockRequest.headers['x-api-key'] = 'mock-api-key';
					origamiService.mockRequest.headers['x-api-secret'] = 'mock-api-secret';
					middleware(origamiService.mockRequest, origamiService.mockResponse, error => {
						caughtError = error;
						done();
					});
				});

				it('fetches a key from the database', () => {
					assert.calledOnce(origamiService.mockApp.model.Key.fetchById);
					assert.calledWithExactly(origamiService.mockApp.model.Key.fetchById, 'mock-api-key');
				});

				it('gets the returned key permission that corresponds to `level`', () => {
					assert.called(mockKey.get);
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
					origamiService.mockRequest.headers['x-api-secret'] = 'mock-api-secret';
					requireAuth(requireAuth.READ)(origamiService.mockRequest, origamiService.mockResponse, done);
				});

				it('gets the returned key "read" permission', () => {
					assert.called(mockKey.get);
					assert.calledWithExactly(mockKey.get, 'read');
				});

			});

		});

		describe('when `level` is `requireAuth.WRITE`', () => {

			describe('middleware(request, response, next)', () => {

				beforeEach(done => {
					origamiService.mockRequest.headers['x-api-key'] = 'mock-api-key';
					origamiService.mockRequest.headers['x-api-secret'] = 'mock-api-secret';
					requireAuth(requireAuth.WRITE)(origamiService.mockRequest, origamiService.mockResponse, done);
				});

				it('gets the returned key "write" permission', () => {
					assert.called(mockKey.get);
					assert.calledWithExactly(mockKey.get, 'write');
				});

			});

		});

		describe('when `level` is `requireAuth.ADMIN`', () => {

			describe('middleware(request, response, next)', () => {

				beforeEach(done => {
					origamiService.mockRequest.headers['x-api-key'] = 'mock-api-key';
					origamiService.mockRequest.headers['x-api-secret'] = 'mock-api-secret';
					requireAuth(requireAuth.ADMIN)(origamiService.mockRequest, origamiService.mockResponse, done);
				});

				it('gets the returned key "admin" permission', () => {
					assert.called(mockKey.get);
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
