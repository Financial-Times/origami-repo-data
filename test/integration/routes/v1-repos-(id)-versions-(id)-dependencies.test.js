/* global agent, app */
'use strict';

const database = require('../helpers/database');
const assert = require('proclaim');

describe('GET /v1/repos/:repoId/versions/:versionId/dependencies', () => {
	let request;

	beforeEach(async () => {
		await database.seed(app, 'basic');
		request = agent
			.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/5bdc1cb5-19f1-4afe-883b-83c822fbbde0/dependencies')
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

		it('is the version dependencies', () => {
			assert.isArray(response);
			assert.lengthEquals(response, 4);

			const dependency1 = response[0];
			assert.isObject(dependency1);
			assert.deepEqual(dependency1, {
				name: 'mock-bower-dependency-1',
				version: '^1.2.3',
				source: 'bower',
				isDev: false,
				isOptional: false
			});

			const dependency2 = response[1];
			assert.isObject(dependency2);
			assert.deepEqual(dependency2, {
				name: 'mock-bower-dependency-2',
				version: '^4.5.6',
				source: 'bower',
				isDev: false,
				isOptional: false
			});

			const dependency3 = response[2];
			assert.isObject(dependency3);
			assert.deepEqual(dependency3, {
				name: 'mock-bower-dependency-3',
				version: '^1.2.3',
				source: 'bower',
				isDev: true,
				isOptional: false
			});

			const dependency4 = response[3];
			assert.isObject(dependency4);
			assert.deepEqual(dependency4, {
				name: 'mock-bower-dependency-4',
				version: '^4.5.6',
				source: 'bower',
				isDev: true,
				isOptional: false
			});

		});

	});

	describe('when the repository has both Bower and npm dependencies', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.get('/v1/repos/855d47ce-697e-51b9-9882-0c3c9044f0f5/versions/3731599a-f6a0-4856-8f28-9d10bc567d5b/dependencies')
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

			it('is the version dependencies', () => {
				assert.isArray(response);
				assert.lengthEquals(response, 7);

				const dependency1 = response[0];
				assert.isObject(dependency1);
				assert.deepEqual(dependency1, {
					name: 'mock-bower-dependency-1',
					version: '^1.2.3',
					source: 'bower',
					isDev: false,
					isOptional: false
				});

				const dependency2 = response[1];
				assert.isObject(dependency2);
				assert.deepEqual(dependency2, {
					name: 'mock-bower-dependency-2',
					version: '^4.5.6',
					source: 'bower',
					isDev: false,
					isOptional: false
				});

				const dependency3 = response[2];
				assert.isObject(dependency3);
				assert.deepEqual(dependency3, {
					name: 'mock-npm-dependency-1',
					version: '^1.2.3',
					source: 'npm',
					isDev: false,
					isOptional: false
				});

				const dependency4 = response[3];
				assert.isObject(dependency4);
				assert.deepEqual(dependency4, {
					name: 'mock-npm-dependency-2',
					version: '^4.5.6',
					source: 'npm',
					isDev: false,
					isOptional: false
				});

				const dependency5 = response[4];
				assert.isObject(dependency5);
				assert.deepEqual(dependency5, {
					name: 'mock-npm-dependency-3',
					version: '^1.2.3',
					source: 'npm',
					isDev: true,
					isOptional: false
				});

				const dependency6 = response[5];
				assert.isObject(dependency6);
				assert.deepEqual(dependency6, {
					name: 'mock-npm-dependency-4',
					version: '^4.5.6',
					source: 'npm',
					isDev: true,
					isOptional: false
				});

				const dependency7 = response[6];
				assert.isObject(dependency7);
				assert.deepEqual(dependency7, {
					name: 'mock-npm-dependency-5',
					version: '^1.2.3',
					source: 'npm',
					isDev: false,
					isOptional: true
				});

			});

		});

	});

	describe('when :repoId is not a valid repo ID', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.get('/v1/repos/not-an-id/versions/5bdc1cb5-19f1-4afe-883b-83c822fbbde0/dependencies')
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
				.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/not-an-id/dependencies')
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

	describe('when the version does not have any dependencies', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.get('/v1/repos/833bf423-4952-53e7-8fc0-e9e8554caf77/versions/ecd0f3c7-dac8-4354-95e0-cb9c0cd686ea/dependencies')
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
				.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/3731599a-f6a0-4856-8f28-9d10bc567d5b/dependencies')
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
			request = agent.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/5bdc1cb5-19f1-4afe-883b-83c822fbbde0/dependencies');
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
				.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/5bdc1cb5-19f1-4afe-883b-83c822fbbde0/dependencies')
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
