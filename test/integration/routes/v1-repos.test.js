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

		it('is an array of the latest stored versions for each repository in the database', () => {
			assert.isArray(response);
			assert.lengthEquals(response, 2);

			const repo1 = response[0];
			assert.isObject(repo1);
			assert.strictEqual(repo1.id, '855d47ce-697e-51b9-9882-0c3c9044f0f5');
			assert.strictEqual(repo1.name, 'mock-service');

			const repo2 = response[1];
			assert.isObject(repo2);
			assert.strictEqual(repo2.id, 'c990cb4b-c82b-5071-afb0-16149debc53d');
			assert.strictEqual(repo2.name, 'o-mock-component');

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

		it('responds with HTML', () => {
			return request.expect('Content-Type', /text\/html/);
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

		it('responds with HTML', () => {
			return request.expect('Content-Type', /text\/html/);
		});

	});

});
