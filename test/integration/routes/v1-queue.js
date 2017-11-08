/* global agent, app */
'use strict';

const database = require('../helpers/database');
const assert = require('proclaim');

describe('GET /v1/queue', () => {
	let request;

	beforeEach(async () => {
		await database.seed(app, 'basic');
		request = agent
			.get('/v1/queue')
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

		it('has a `queue` array property', () => {
			assert.isArray(response.queue);
		});

		it('includes each ingestion in the database', () => {
			assert.lengthEquals(response.queue, 5);

			const ingestion1 = response.queue[0];
			assert.isObject(ingestion1);
			assert.strictEqual(ingestion1.id, '5a070ea9-44f8-4312-8080-c4882d642ec4');

			const ingestion2 = response.queue[1];
			assert.isObject(ingestion2);
			assert.strictEqual(ingestion2.id, '988451cb-6d71-4a68-b435-3d5cf30b9614');

		});

	});

	describe('when no API credentials are provided', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent.get('/v1/queue');
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
				.get('/v1/queue')
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

describe('POST /v1/queue', () => {
	let request;

	beforeEach(async () => {
		await database.seed(app, 'basic');
		request = agent
			.post('/v1/queue')
			.set('X-Api-Key', 'mock-write-key')
			.set('X-Api-Secret', 'mock-write-secret')
			.send({
				url: 'https://github.com/Financial-Times/o-mock-component',
				tag: 'v5.6.7',
				id: 'extra-property-id'
			});
	});

	it('creates a new ingestion in the database, saving only safe properties', async () => {
		await request.then();
		const ingestions = await app.database.knex.select('*').from('ingestion_queue').where({
			tag: 'v5.6.7'
		});
		assert.lengthEquals(ingestions, 1);
		assert.isString(ingestions[0].id);
		assert.notStrictEqual(ingestions[0].id, 'extra-property-id');
		assert.strictEqual(ingestions[0].url, 'https://github.com/Financial-Times/o-mock-component');
		assert.strictEqual(ingestions[0].tag, 'v5.6.7');
		assert.strictEqual(ingestions[0].ingestion_attempts, 0);
		assert.isNull(ingestions[0].ingestion_started_at);
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

		it('has a `ingestion` object property', () => {
			assert.isObject(response.ingestion);
		});

		it('includes the ID of the new ingestion', async () => {
			const ingestions = await app.database.knex.select('*').from('ingestion_queue').where({
				tag: 'v5.6.7'
			});
			assert.isString(response.ingestion.id);
			assert.strictEqual(response.ingestion.id, ingestions[0].id);
		});

	});

	describe('when the request does not include a url or tag property', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.post('/v1/queue')
				.set('X-Api-Key', 'mock-write-key')
				.set('X-Api-Secret', 'mock-write-secret')
				.send({});
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
				assert.match(response, /url.+is required/);
				assert.match(response, /tag.+is required/);
			});

		});

	});

	describe('when no API credentials are provided', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent.post('/v1/queue');
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
				.post('/v1/queue')
				.set('X-Api-Key', 'mock-read-key')
				.set('X-Api-Secret', 'mock-read-secret');
		});

		it('responds with a 403 status', () => {
			return request.expect(403);
		});

		it('responds with HTML', () => {
			return request.expect('Content-Type', /text\/html/);
		});

	});

});
