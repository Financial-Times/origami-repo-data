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
			assert.deepEqual(repo2.brands, ['master', 'internal']);

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

describe('GET /v1/repos with query:', () => {
	let request;

	beforeEach(async () => {
		await database.seed(app, 'search');
	});

	describe('status=active', () => {

		beforeEach(async () => {
			request = agent
				.get('/v1/repos?status=active')
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

			it('contains only actively supported repos', () => {
				assert.isArray(response);
				assert.lengthEquals(response, 4);
				for (const repo of response) {
					assert.strictEqual(repo.support.status, 'active');
				}
			});

		});

	});

	describe('status=deprecated', () => {

		beforeEach(async () => {
			request = agent
				.get('/v1/repos?status=deprecated')
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

			it('contains only deprecated repos', () => {
				assert.isArray(response);
				assert.lengthEquals(response, 1);
				for (const repo of response) {
					assert.strictEqual(repo.support.status, 'deprecated');
				}
			});

		});

	});

	describe('status=experimental,deprecated', () => {

		beforeEach(async () => {
			request = agent
				.get('/v1/repos?status=experimental,deprecated')
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

			it('contains both experimental and deprecated repos', () => {
				assert.isArray(response);
				assert.lengthEquals(response, 2);
				for (const repo of response) {
					assert.include(['experimental', 'deprecated'], repo.support.status);
				}
			});

		});

	});

	describe('type=module', () => {

		beforeEach(async () => {
			request = agent
				.get('/v1/repos?type=module')
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

			it('contains only module components', () => {
				assert.isArray(response);
				assert.lengthEquals(response, 6);
				for (const repo of response) {
					assert.strictEqual(repo.type, 'module');
				}
			});

		});

	});

	describe('type=service', () => {

		beforeEach(async () => {
			request = agent
				.get('/v1/repos?type=service')
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

			it('contains only service components', () => {
				assert.isArray(response);
				assert.lengthEquals(response, 1);
				for (const repo of response) {
					assert.strictEqual(repo.type, 'service');
				}
			});

		});

	});

	describe('type=module,service', () => {

		beforeEach(async () => {
			request = agent
				.get('/v1/repos?type=module,service')
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

			it('contains both module and service components', () => {
				assert.isArray(response);
				assert.lengthEquals(response, 7);
				for (const repo of response) {
					assert.include(['module', 'service'], repo.type);
				}
			});

		});

	});

	describe('brand=master', () => {

		beforeEach(async () => {
			request = agent
				.get('/v1/repos?brand=master')
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

			it('contains only masterbrand components', () => {
				assert.isArray(response);
				assert.lengthEquals(response, 2);
				for (const repo of response) {
					assert.include(repo.brands, 'master');
				}
			});

		});

	});

	describe('brand=internal', () => {

		beforeEach(async () => {
			request = agent
				.get('/v1/repos?brand=internal')
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

			it('contains only internal branded components', () => {
				assert.isArray(response);
				assert.lengthEquals(response, 3);
				for (const repo of response) {
					assert.include(repo.brands, 'internal');
				}
			});

		});

	});

	describe('brand=none', () => {

		beforeEach(async () => {
			request = agent
				.get('/v1/repos?brand=none')
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

			it('contains only components which have not been branded', () => {
				assert.isArray(response);
				assert.lengthEquals(response, 5);
				for (const repo of response) {
					if (repo.type === 'module') {
						assert.deepEqual(repo.brands, []);
					} else {
						assert.isNull(repo.brands);
					}
				}
			});

		});

	});

	describe('brand=all', () => {

		beforeEach(async () => {
			request = agent
				.get('/v1/repos?brand=all')
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

			it('contains only components which have been branded (with any brand)', () => {
				assert.isArray(response);
				assert.lengthEquals(response, 4);
				for (const repo of response) {
					assert.notStrictEqual(repo.brands.length, 0);
				}
			});

		});

	});

	describe('brand=master,internal', () => {

		beforeEach(async () => {
			request = agent
				.get('/v1/repos?brand=master,internal')
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

			it('contains both masterbrand and internal branded components', () => {
				assert.isArray(response);
				assert.lengthEquals(response, 4);
				for (const repo of response) {
					if (repo.brands.length === 1) {
						assert.include(['master', 'internal'], repo.brands[0]);
					} else {
						assert.deepEqual(repo.brands, ['master', 'internal']);
					}
				}
			});

		});

	});

	describe('q=apple', () => {

		beforeEach(async () => {
			request = agent
				.get('/v1/repos?q=apple')
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

			it('contains matching components in the expected order (name, keywords, inferred keywords)', () => {
				assert.isArray(response);
				assert.lengthEquals(response, 4);
				assert.deepEqual(response.map(repo => repo.name), [
					'active-module',
					'active-imageset',
					'active-service',
					'deprecated-module'
				]);
			});

		});

	});

	describe('q=kumquat', () => {

		beforeEach(async () => {
			request = agent
				.get('/v1/repos?q=kumquat')
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

			it('contains matching components in the expected order (name, keywords, inferred keywords)', () => {
				assert.isArray(response);
				assert.lengthEquals(response, 2);
				assert.deepEqual(response.map(repo => repo.name), [
					'kumquat',
					'active-module'
				]);
			});

		});

	});

	describe('q=banana&status=active&type=module&brand=none', () => {

		beforeEach(async () => {
			request = agent
				.get('/v1/repos?q=banana&status=active&type=module&brand=none')
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

			it('contains components which match all criteria', () => {
				assert.isArray(response);
				assert.lengthEquals(response, 1);
				assert.strictEqual(response[0].name, 'new-module (banana)');
			});

		});

	});

});
