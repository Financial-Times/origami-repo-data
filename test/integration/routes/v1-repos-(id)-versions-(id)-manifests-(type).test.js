/* global agent, app */
'use strict';

const database = require('../helpers/database');
const assert = require('proclaim');

describe('GET /v1/repos/:repoId/versions/:versionId/manifests/:manifestType', () => {
	let request;

	beforeEach(async () => {
		await database.seed(app, 'basic');
		request = agent
			.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/5bdc1cb5-19f1-4afe-883b-83c822fbbde0/manifests/origami')
			.set('X-Api-Key', 'mock-read-key')
			.set('X-Api-Secret', 'mock-read-secret');
	});

	it('responds with a 200 status', () => {
		return request.expect(200);
	});

	it('responds with JSON', () => {
		return request.expect('Content-Type', /application\/json/);
	});

	describe('JSON response', () => {
		let response;

		beforeEach(async () => {
			response = (await request.then()).body;
		});

		it('is the requested manifest', () => {
			assert.isObject(response);
			assert.strictEqual(response.name, 'o-mock-component');
			assert.strictEqual(response.origamiType, 'module');
		});

	});

	describe('when :repoId is not a valid repo ID', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.get('/v1/repos/not-an-id/versions/5bdc1cb5-19f1-4afe-883b-83c822fbbde0/manifests/origami')
				.set('X-Api-Key', 'mock-read-key')
				.set('X-Api-Secret', 'mock-read-secret');
		});

		it('responds with a 404 status', () => {
			return request.expect(404);
		});

		it('responds with JSON', () => {
			return request.expect('Content-Type', /application\/json/);
		});

		describe('JSON response', () => {
			let response;

			beforeEach(async () => {
				response = (await request.then()).body;
			});

			it('contains the error details', () => {
				assert.isObject(response);
				assert.strictEqual(response.message, 'Not Found');
				assert.strictEqual(response.status, 404);
			});

		});

	});

	describe('when :versionId is not a valid version ID', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/not-an-id/manifests/origami')
				.set('X-Api-Key', 'mock-read-key')
				.set('X-Api-Secret', 'mock-read-secret');
		});

		it('responds with a 404 status', () => {
			return request.expect(404);
		});

		it('responds with JSON', () => {
			return request.expect('Content-Type', /application\/json/);
		});

		describe('JSON response', () => {
			let response;

			beforeEach(async () => {
				response = (await request.then()).body;
			});

			it('contains the error details', () => {
				assert.isObject(response);
				assert.strictEqual(response.message, 'Not Found');
				assert.strictEqual(response.status, 404);
			});

		});

	});

	describe('when :manifestType does not exist in the version manifests', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/5bdc1cb5-19f1-4afe-883b-83c822fbbde0/manifests/not-a-manifest')
				.set('X-Api-Key', 'mock-read-key')
				.set('X-Api-Secret', 'mock-read-secret');
		});

		it('responds with a 404 status', () => {
			return request.expect(404);
		});

		it('responds with JSON', () => {
			return request.expect('Content-Type', /application\/json/);
		});

		describe('JSON response', () => {
			let response;

			beforeEach(async () => {
				response = (await request.then()).body;
			});

			it('contains the error details', () => {
				assert.isObject(response);
				assert.strictEqual(response.message, 'Not Found');
				assert.strictEqual(response.status, 404);
			});

		});

	});

	describe('when :repoId and :versionID are mismatched', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/3731599a-f6a0-4856-8f28-9d10bc567d5b/manifests/origami')
				.set('X-Api-Key', 'mock-read-key')
				.set('X-Api-Secret', 'mock-read-secret');
		});

		it('responds with a 404 status', () => {
			return request.expect(404);
		});

		it('responds with JSON', () => {
			return request.expect('Content-Type', /application\/json/);
		});

		describe('JSON response', () => {
			let response;

			beforeEach(async () => {
				response = (await request.then()).body;
			});

			it('contains the error details', () => {
				assert.isObject(response);
				assert.strictEqual(response.message, 'Not Found');
				assert.strictEqual(response.status, 404);
			});

		});

	});

	describe('when no API credentials are provided', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/5bdc1cb5-19f1-4afe-883b-83c822fbbde0/manifests/origami');
		});

		it('responds with a 401 status', () => {
			return request.expect(401);
		});

		it('responds with JSON', () => {
			return request.expect('Content-Type', /application\/json/);
		});

		describe('JSON response', () => {
			let response;

			beforeEach(async () => {
				response = (await request.then()).body;
			});

			it('contains the error details', () => {
				assert.isObject(response);
				assert.match(response.message, /api key\/secret .* required/i);
				assert.strictEqual(response.status, 401);
			});

		});

	});

	describe('when the provided API key does not have the required permissions', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/5bdc1cb5-19f1-4afe-883b-83c822fbbde0/manifests/origami')
				.set('X-Api-Key', 'mock-no-key')
				.set('X-Api-Secret', 'mock-no-secret');
		});

		it('responds with a 403 status', () => {
			return request.expect(403);
		});

		it('responds with JSON', () => {
			return request.expect('Content-Type', /application\/json/);
		});

		describe('JSON response', () => {
			let response;

			beforeEach(async () => {
				response = (await request.then()).body;
			});

			it('contains the error details', () => {
				assert.isObject(response);
				assert.match(response.message, /not authorized/i);
				assert.strictEqual(response.status, 403);
			});

		});

	});

});
