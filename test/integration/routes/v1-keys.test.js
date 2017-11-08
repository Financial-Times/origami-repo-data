/* global agent, app */
'use strict';

const bcrypt = require('bcrypt');
const database = require('../helpers/database');
const assert = require('proclaim');

describe('GET /v1/keys', () => {
	let request;

	beforeEach(async () => {
		await database.seed(app, 'basic');
		request = agent
			.get('/v1/keys')
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

		it('has a `keys` array property', () => {
			assert.isArray(response.keys);
		});

		it('includes each key in the database with no secrets output', () => {
			assert.lengthEquals(response.keys, 4);

			const key1 = response.keys[0];
			assert.isObject(key1);
			assert.strictEqual(key1.id, 'mock-admin-key');
			assert.isUndefined(key1.secret);

			const key2 = response.keys[1];
			assert.isObject(key2);
			assert.strictEqual(key2.id, 'mock-write-key');
			assert.isUndefined(key2.secret);

			const key3 = response.keys[2];
			assert.isObject(key3);
			assert.strictEqual(key3.id, 'mock-read-key');
			assert.isUndefined(key3.secret);

			const key4 = response.keys[3];
			assert.isObject(key4);
			assert.strictEqual(key4.id, 'mock-no-key');
			assert.isUndefined(key4.secret);

		});

	});

	describe('when no API credentials are provided', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent.get('/v1/keys');
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
				.get('/v1/keys')
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

describe('POST /v1/keys', () => {
	let request;

	beforeEach(async () => {
		await database.seed(app, 'basic');
		request = agent
			.post('/v1/keys')
			.set('X-Api-Key', 'mock-admin-key')
			.set('X-Api-Secret', 'mock-admin-secret')
			.send({
				description: 'mock description',
				read: true,
				write: true,
				admin: false,
				id: 'extra-property-id',
				secret: 'extra-property-secret',
			});
	});

	it('creates a new key in the database, saving only safe properties', async () => {
		await request.then();
		const keys = await app.database.knex.select('*').from('keys').where({
			description: 'mock description'
		});
		assert.lengthEquals(keys, 1);
		assert.isString(keys[0].id);
		assert.notStrictEqual(keys[0].id, 'extra-property-id');
		assert.isString(keys[0].secret);
		assert.isFalse(await bcrypt.compare('extra-property-secret', keys[0].secret));
		assert.isTrue(keys[0].read);
		assert.isTrue(keys[0].write);
		assert.isFalse(keys[0].admin);
		assert.isFalse(keys[0].admin);
	});

	it('responds with a 201 status', () => {
		return request.expect(201);
	});

	it('responds with JSON', () => {
		return request.expect('Content-Type', /application\/json/);
	});

	describe('JSON response', () => {
		let response;

		beforeEach(async () => {
			response = (await request.then()).body;
		});

		it('has a `credentials` object property', () => {
			assert.isObject(response.credentials);
		});

		it('includes the ID and secret of the new key', async () => {
			const keys = await app.database.knex.select('*').from('keys').where({
				description: 'mock description'
			});
			assert.isString(response.credentials.id);
			assert.isString(response.credentials.secret);
			assert.isTrue(await bcrypt.compare(response.credentials.secret, keys[0].secret));
		});

	});

	describe('when the request does not include a description property', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.post('/v1/keys')
				.set('X-Api-Key', 'mock-admin-key')
				.set('X-Api-Secret', 'mock-admin-secret')
				.send({
					read: true,
					write: true,
					admin: false
				});
		});

		it('responds with a 400 status', () => {
			return request.expect(400);
		});

		it('responds with HTML', () => {
			return request.expect('Content-Type', /text\/html/);
		});

		describe('HTML response', () => {
			let response;

			beforeEach(async () => {
				response = (await request.then()).text;
			});

			it('includes a descriptive error', () => {
				assert.match(response, /description.+is required/);
			});

		});

	});

	describe('when the request does not include permission properties', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.post('/v1/keys')
				.set('X-Api-Key', 'mock-admin-key')
				.set('X-Api-Secret', 'mock-admin-secret')
				.send({
					description: 'mock description'
				});
		});

		it('creates a new key in the database with defaulted permissions', async () => {
			await request.then();
			const keys = await app.database.knex.select('*').from('keys').where({
				description: 'mock description'
			});
			assert.lengthEquals(keys, 1);
			assert.isTrue(keys[0].read);
			assert.isFalse(keys[0].write);
			assert.isFalse(keys[0].admin);
		});

		it('responds with a 201 status', () => {
			return request.expect(201);
		});

		it('responds with JSON', () => {
			return request.expect('Content-Type', /application\/json/);
		});

	});

	describe('when the request has invalid permission properties', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.post('/v1/keys')
				.set('X-Api-Key', 'mock-admin-key')
				.set('X-Api-Secret', 'mock-admin-secret')
				.send({
					description: 'mock description',
					read: 123,
					write: [],
					admin: 'nope'
				});
		});

		it('responds with a 400 status', () => {
			return request.expect(400);
		});

		it('responds with HTML', () => {
			return request.expect('Content-Type', /text\/html/);
		});

		describe('HTML response', () => {
			let response;

			beforeEach(async () => {
				response = (await request.then()).text;
			});

			it('includes a descriptive error', () => {
				assert.match(response, /read.+must be a boolean/);
				assert.match(response, /write.+must be a boolean/);
				assert.match(response, /admin.+must be a boolean/);
			});

		});

	});

	describe('when no API credentials are provided', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent.post('/v1/keys');
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
				.post('/v1/keys')
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
