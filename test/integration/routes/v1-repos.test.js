/* global agent, app */
'use strict';

const database = require('../helpers/database');
const assert = require('proclaim');

describe('GET /v1/repos', () => {
	let request;

	beforeEach(async () => {
		await database.seed(app, 'basic');
		request = agent
			.get('/v1/repos')
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

		it('is an array of the latest stable versions for each repository in the database', () => {
			assert.isArray(response);
			assert.lengthEquals(response, 3);

			const repo1 = response[0];
			assert.isObject(repo1);
			assert.strictEqual(repo1.id, '855d47ce-697e-51b9-9882-0c3c9044f0f5');
			assert.strictEqual(repo1.name, 'mock-service');
			assert.strictEqual(repo1.version, '2.1.0');
			assert.strictEqual(repo1.brands, null);

			const repo2 = response[1];
			assert.isObject(repo2);
			assert.strictEqual(repo2.id, 'c990cb4b-c82b-5071-afb0-16149debc53d');
			assert.strictEqual(repo2.name, 'o-mock-component');
			// This is the latest *stable* version, even though 3.0.0-beta.1 exists
			assert.strictEqual(repo2.version, '2.0.0');
			assert.deepEqual(repo2.brands, ['mock-brand']);

			const repo3 = response[2];
			assert.isObject(repo3);
			assert.strictEqual(repo3.id, '833bf423-4952-53e7-8fc0-e9e8554caf77');
			assert.strictEqual(repo3.name, 'o-mock-imageset');
			assert.strictEqual(repo3.version, '1.0.0');
			assert.strictEqual(repo3.brands, null);

		});

	});

	describe('when no API credentials are provided', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent.get('/v1/repos');
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
				.get('/v1/repos')
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
