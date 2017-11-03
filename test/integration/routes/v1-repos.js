/* global agent, app */
'use strict';

const database = require('../helpers/database');
const assert = require('proclaim');

describe('GET /v1/repos', () => {
	let request;

	beforeEach(async () => {
		await database.seed(app, 'basic');
		request = agent.get('/v1/repos');
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

		it('has a `repos` array property', () => {
			assert.isArray(response.repos);
		});

		it('includes the latest stored version for each repository in the database', () => {
			assert.lengthEquals(response.repos, 2);

			const repo1 = response.repos[0];
			assert.isObject(repo1);
			assert.strictEqual(repo1.id, '855d47ce-697e-51b9-9882-0c3c9044f0f5');
			assert.strictEqual(repo1.name, 'mock-service');

			const repo2 = response.repos[1];
			assert.isObject(repo2);
			assert.strictEqual(repo2.id, 'c990cb4b-c82b-5071-afb0-16149debc53d');
			assert.strictEqual(repo2.name, 'o-mock-component');

		});

	});

});
