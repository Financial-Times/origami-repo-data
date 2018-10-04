/* global agent, app */
'use strict';

const database = require('../helpers/database');
const assert = require('proclaim');

describe('GET /v1/repos/:repoId', () => {
	let request;

	beforeEach(async () => {
		await database.seed(app, 'basic');
		request = agent
			.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d')
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

		it('is the latest version for the requested repository', () => {
			assert.isObject(response);
			assert.strictEqual(response.id, 'c990cb4b-c82b-5071-afb0-16149debc53d');
			assert.strictEqual(response.name, 'o-mock-component');
			assert.deepEqual(response.keywords, [
				'keyword1',
				'keyword2'
			]);
			assert.deepEqual(response.inferredKeywords, [
				'branded',
				'demo',
				'example',
				'no-html'
			]);
			assert.deepEqual(response.languages, [
				'mock1',
				'mock2'
			]);
			assert.deepEqual(response.brands, [
				'master',
				'internal'
			]);
		});

	});

	describe('when :repoId is not a valid repo ID', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.get('/v1/repos/not-an-id')
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
			request = agent.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d');
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
				.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d')
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
