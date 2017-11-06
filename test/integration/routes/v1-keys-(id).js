/* global agent, app */
'use strict';

const database = require('../helpers/database');
const assert = require('proclaim');

describe('GET /v1/keys/:keyId', () => {
	let request;

	beforeEach(async () => {
		await database.seed(app, 'basic');
		request = agent
			.get('/v1/keys/mock-read-key')
			.set('X-Api-Key', 'mock-admin-key')
			.set('X-Api-Secret', 'mock-admin-secret');
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

		it('has a `key` object property', () => {
			assert.isObject(response.key);
		});

		it('includes the latest version for the requested key with no secret', () => {

			assert.isObject(response.key);
			assert.strictEqual(response.key.id, 'mock-read-key');
			assert.isUndefined(response.key.secret);

		});

	});

	describe('when :keyId is not a valid key ID', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.get('/v1/keys/not-an-id')
				.set('X-Api-Key', 'mock-admin-key')
				.set('X-Api-Secret', 'mock-admin-secret');
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
			request = agent.get('/v1/keys/mock-read-key');
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
				.get('/v1/keys/mock-read-key')
				.set('X-Api-Key', 'mock-write-key')
				.set('X-Api-Secret', 'mock-write-secret');
		});

		it('responds with a 403 status', () => {
			return request.expect(403);
		});

		it('responds with HTML', () => {
			return request.expect('Content-Type', /text\/html/);
		});

	});

});

describe('DELETE /v1/keys/:keyId', () => {
	let request;

	beforeEach(async () => {
		await database.seed(app, 'basic');
		request = agent
			.delete('/v1/keys/mock-read-key')
			.set('X-Api-Key', 'mock-admin-key')
			.set('X-Api-Secret', 'mock-admin-secret');
	});

	it('responds with a 204 status', () => {
		return request.expect(204);
	});

	it('responds with no content', async () => {
		const response = await request.then();
		assert.isUndefined(response.headers['content-type']);
		assert.strictEqual(response.text, '');
	});

	describe('when :keyId is the same as the key being used to authenticate', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.delete('/v1/keys/mock-admin-key')
				.set('X-Api-Key', 'mock-admin-key')
				.set('X-Api-Secret', 'mock-admin-secret');
		});

		it('responds with a 403 status', () => {
			return request.expect(403);
		});

		it('responds with HTML', () => {
			return request.expect('Content-Type', /text\/html/);
		});

	});

	describe('when :keyId is not a valid key ID', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.delete('/v1/keys/not-an-id')
				.set('X-Api-Key', 'mock-admin-key')
				.set('X-Api-Secret', 'mock-admin-secret');
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
			request = agent.delete('/v1/keys/mock-read-key');
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
				.delete('/v1/keys/mock-read-key')
				.set('X-Api-Key', 'mock-write-key')
				.set('X-Api-Secret', 'mock-write-secret');
		});

		it('responds with a 403 status', () => {
			return request.expect(403);
		});

		it('responds with HTML', () => {
			return request.expect('Content-Type', /text\/html/);
		});

	});

});
