/* global agent, app */
'use strict';

const database = require('../helpers/database');
const assert = require('proclaim');

describe('GET /v1/repos/:repoId/versions', () => {
	let request;

	beforeEach(async () => {
		await database.seed(app, 'basic');
		request = agent
			.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions')
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

		it('has a `versions` array property', () => {
			assert.isArray(response.versions);
		});

		it('includes the latest stored version for each repository in the database', () => {
			assert.lengthEquals(response.versions, 3);

			const version1 = response.versions[0];
			assert.isObject(version1);
			assert.strictEqual(version1.id, '9e4e450d-3b70-4672-b459-f297d434add6');
			assert.strictEqual(version1.name, 'o-mock-component');
			assert.strictEqual(version1.version, 'v2.0.0');

			const version2 = response.versions[1];
			assert.isObject(version2);
			assert.strictEqual(version2.id, 'b2bdfae1-cc6f-4433-9a2f-8a4b762cda71');
			assert.strictEqual(version2.name, 'o-mock-component');
			assert.strictEqual(version2.version, 'v1.1.0');

			const version3 = response.versions[2];
			assert.isObject(version3);
			assert.strictEqual(version3.id, '5bdc1cb5-19f1-4afe-883b-83c822fbbde0');
			assert.strictEqual(version3.name, 'o-mock-component');
			assert.strictEqual(version3.version, 'v1.0.0');

		});

	});

	describe('when :repoId is not a valid repo ID', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.get('/v1/repos/not-an-id/versions')
				.set('X-Api-Key', 'mock-read-key')
				.set('X-Api-Secret', 'mock-read-secret');
		});

		it('responds with a 404 status', () => {
			return request.expect(404);
		});

		it('responds with HTML', () => {
			return request.expect('Content-Type', /text\/html/);
		});

	});

	describe('when no API credentials are provided', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions');
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
				.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions')
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
