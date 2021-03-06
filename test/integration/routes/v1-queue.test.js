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

		it('is an array of each ingestion in the database', () => {
			assert.isArray(response);
			assert.lengthEquals(response, 6);

			const ingestion1 = response[0];
			assert.isObject(ingestion1);
			assert.strictEqual(ingestion1.id, '5a070ea9-44f8-4312-8080-c4882d642ec4');

			const ingestion2 = response[1];
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
				.get('/v1/queue')
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

	it('creates a new version ingestion in the database, saving only safe properties', async () => {
		await request.then();
		const ingestions = await app.database.knex.select('*').from('ingestion_queue').where({
			tag: 'v5.6.7'
		});
		assert.lengthEquals(ingestions, 1);
		assert.isString(ingestions[0].id);
		assert.notStrictEqual(ingestions[0].id, 'extra-property-id');
		assert.strictEqual(ingestions[0].url, 'https://github.com/Financial-Times/o-mock-component');
		assert.strictEqual(ingestions[0].tag, 'v5.6.7');
		assert.strictEqual(ingestions[0].type, 'version');
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

		it('is the new ingestion', async () => {
			const ingestions = await app.database.knex.select('*').from('ingestion_queue').where({
				tag: 'v5.6.7'
			});
			assert.isObject(response);
			assert.isString(response.id);
			assert.strictEqual(response.id, ingestions[0].id);
		});

	});

	describe('when an ingestion with the given url and tag already exists', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.post('/v1/queue')
				.set('X-Api-Key', 'mock-write-key')
				.set('X-Api-Secret', 'mock-write-secret')
				.send({
					url: 'https://github.com/Financial-Times/o-mock-component',
					tag: 'v2.1.0'
				});
		});

		it('responds with a 409 status', () => {
			return request.expect(409);
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
				assert.strictEqual(response.message, 'Validation failed');
				assert.deepEqual(response.validation, [
					'An ingestion or version with the given URL and tag already exists'
				]);
				assert.strictEqual(response.status, 409);
			});

		});

	});

	describe('when a version with the given url and tag already exists', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.post('/v1/queue')
				.set('X-Api-Key', 'mock-write-key')
				.set('X-Api-Secret', 'mock-write-secret')
				.send({
					url: 'https://github.com/Financial-Times/o-mock-component',
					tag: 'v1.0.0'
				});
		});

		it('responds with a 409 status', () => {
			return request.expect(409);
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
				assert.strictEqual(response.message, 'Validation failed');
				assert.deepEqual(response.validation, [
					'An ingestion or version with the given URL and tag already exists'
				]);
				assert.strictEqual(response.status, 409);
			});

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
				assert.strictEqual(response.message, 'Validation failed');
				assert.deepEqual(response.validation, [
					'"url" is required',
					'"tag" is required'
				]);
				assert.strictEqual(response.status, 400);
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
				.post('/v1/queue')
				.set('X-Api-Key', 'mock-read-key')
				.set('X-Api-Secret', 'mock-read-secret');
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

	describe('when the ingestion type "bundle" is given', () => {
		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.post('/v1/queue')
				.set('X-Api-Key', 'mock-write-key')
				.set('X-Api-Secret', 'mock-write-secret')
				.send({
					url: 'https://github.com/Financial-Times/o-mock-component',
					tag: 'v5.6.7',
					type: 'bundle',
					id: 'extra-property-id'
				});
		});

		it('creates a new bundle ingestion in the database, saving only safe properties', async () => {
			await request.then();
			const ingestions = await app.database.knex.select('*').from('ingestion_queue').where({
				tag: 'v5.6.7'
			});
			assert.lengthEquals(ingestions, 1);
			assert.isString(ingestions[0].id);
			assert.notStrictEqual(ingestions[0].id, 'extra-property-id');
			assert.strictEqual(ingestions[0].url, 'https://github.com/Financial-Times/o-mock-component');
			assert.strictEqual(ingestions[0].tag, 'v5.6.7');
			assert.strictEqual(ingestions[0].type, 'bundle');
			assert.strictEqual(ingestions[0].ingestion_attempts, 0);
			assert.isNull(ingestions[0].ingestion_started_at);
		});

		describe('when an ingestion with the given url and tag already exists', () => {
			let request;

			beforeEach(async () => {
				await database.seed(app, 'basic');
				request = agent
					.post('/v1/queue')
					.set('X-Api-Key', 'mock-write-key')
					.set('X-Api-Secret', 'mock-write-secret')
					.send({
						url: 'https://github.com/Financial-Times/o-mock-component',
						tag: 'v1.0.0',
						type: 'bundle'
					});
			});

			it('responds with a 409 status', () => {
				return request.expect(409);
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
					assert.strictEqual(response.message, 'Validation failed');
					assert.deepEqual(response.validation, [
						'An ingestion or version with the given URL and tag already exists'
					]);
					assert.strictEqual(response.status, 409);
				});

			});

		});
	});

	describe('when an invalid ingestion type "nonsense" is given', () => {
		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.post('/v1/queue')
				.set('X-Api-Key', 'mock-write-key')
				.set('X-Api-Secret', 'mock-write-secret')
				.send({
					url: 'https://github.com/Financial-Times/o-mock-component',
					tag: 'v5.6.7',
					type: 'nonsense',
					id: 'extra-property-id'
				});
		});

		it('responds with a 400 status', () => {
			return request.expect(400);
		});
	});
});

describe('POST /v1/queue (accepting a GitHub webhook)', () => {
	let request;

	beforeEach(async () => {
		await database.seed(app, 'basic');
		request = agent
			.post('/v1/queue?apiKey=mock-write-key&apiSecret=mock-write-secret')
			.set('X-GitHub-Event', 'create')
			.send({
				ref_type: 'tag',
				ref: 'v5.6.7',
				repository: {
					html_url: 'https://github.com/Financial-Times/o-mock-component'
				}
			});
	});

	it('creates a new ingestion in the database', async () => {
		await request.then();
		const ingestions = await app.database.knex.select('*').from('ingestion_queue').where({
			tag: 'v5.6.7'
		});
		assert.lengthEquals(ingestions, 1);
		assert.isString(ingestions[0].id);
		assert.strictEqual(ingestions[0].url, 'https://github.com/Financial-Times/o-mock-component');
		assert.strictEqual(ingestions[0].tag, 'v5.6.7');
		assert.strictEqual(ingestions[0].type, 'version');
		assert.strictEqual(ingestions[0].ingestion_attempts, 0);
		assert.isNull(ingestions[0].ingestion_started_at);
	});

	it('responds with a 201 status', () => {
		return request.expect(201);
	});

	it('responds with text', () => {
		return request.expect('Content-Type', /text\/plain/);
	});

	describe('when the `X-GitHub-Event` header is not "create"', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.post('/v1/queue?apiKey=mock-write-key&apiSecret=mock-write-secret')
				.set('X-GitHub-Event', 'nope')
				.send({
					ref_type: 'tag',
					ref: 'v5.6.7',
					repository: {
						html_url: 'https://github.com/Financial-Times/o-mock-component'
					}
				});
		});

		it('responds with a 400 status', () => {
			return request.expect(400);
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
				assert.strictEqual(response.message, 'Only the "create" GitHub event is supported');
				assert.strictEqual(response.status, 400);
			});

		});

	});

	describe('when the request body `ref_type` property is not "tag"', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.post('/v1/queue?apiKey=mock-write-key&apiSecret=mock-write-secret')
				.set('X-GitHub-Event', 'create')
				.send({
					ref_type: 'branch',
					ref: 'new-branch',
					repository: {
						html_url: 'https://github.com/Financial-Times/o-mock-component'
					}
				});
		});

		it('responds with a 202 status', () => {
			return request.expect(202);
		});

		it('responds with text', () => {
			return request.expect('Content-Type', /text\/plain/);
		});

	});

	describe('when the request body `ref` property is not a valid semantic version', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.post('/v1/queue?apiKey=mock-write-key&apiSecret=mock-write-secret')
				.set('X-GitHub-Event', 'create')
				.send({
					ref_type: 'tag',
					ref: 'new-tag',
					repository: {
						html_url: 'https://github.com/Financial-Times/o-mock-component'
					}
				});
		});

		it('responds with a 202 status', () => {
			return request.expect(202);
		});

		it('responds with text', () => {
			return request.expect('Content-Type', /text\/plain/);
		});

	});

	describe('when the request body `repository.html_url` property is not set', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.post('/v1/queue?apiKey=mock-write-key&apiSecret=mock-write-secret')
				.set('X-GitHub-Event', 'create')
				.send({
					ref_type: 'tag',
					ref: 'v5.6.7',
					repository: {}
				});
		});

		it('responds with a 400 status', () => {
			return request.expect(400);
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
				assert.strictEqual(response.message, 'A repository URL is required');
				assert.strictEqual(response.status, 400);
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
				.post('/v1/queue?apiKey=mock-read-key&apiSecret=mock-read-secret')
				.set('X-GitHub-Event', 'create')
				.send({
					ref_type: 'tag',
					ref: 'v5.6.7',
					repository: {
						html_url: 'https://github.com/Financial-Times/o-mock-component'
					}
				});
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
