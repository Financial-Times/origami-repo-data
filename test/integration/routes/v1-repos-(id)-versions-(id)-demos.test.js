/* global agent, app */
'use strict';

const database = require('../helpers/database');
const assert = require('proclaim');

describe('GET /v1/repos/:repoId/versions/:versionId/demos', () => {

	describe('for a spec v1 component version', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/5bdc1cb5-19f1-4afe-883b-83c822fbbde0/demos');
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

			it('is the version demos with some normalisation applied, and hidden/invalid demos removed', () => {
				assert.isArray(response);
				assert.lengthEquals(response, 4);

				const demo1 = response[0];
				assert.isObject(demo1);
				assert.strictEqual(demo1.id, 'example1');
				assert.strictEqual(demo1.title, 'Example Demo 1');
				assert.strictEqual(demo1.description, 'This is an example demo');
				assert.isObject(demo1.supportingUrls);
				assert.strictEqual(demo1.supportingUrls.live, 'https://www.ft.com/__origami/service/build/v2/demos/o-mock-component@1.0.0/example1?brand=core');
				assert.strictEqual(demo1.supportingUrls.html, 'https://www.ft.com/__origami/service/build/v2/demos/o-mock-component@1.0.0/example1/html?brand=core');
				assert.deepEqual(demo1.display, {
					live: true,
					html: true
				});

				const demo2 = response[1];
				assert.isObject(demo2);
				assert.strictEqual(demo2.id, 'example2');
				assert.strictEqual(demo2.title, 'Example Demo 2');
				assert.isNull(demo2.description);
				assert.isObject(demo2.supportingUrls);
				assert.strictEqual(demo2.supportingUrls.live, 'https://www.ft.com/__origami/service/build/v2/demos/o-mock-component@1.0.0/example2?brand=core');
				assert.strictEqual(demo2.supportingUrls.html, 'https://www.ft.com/__origami/service/build/v2/demos/o-mock-component@1.0.0/example2/html?brand=core');
				assert.deepEqual(demo2.display, {
					live: true,
					html: true
				});

				const demo3 = response[2];
				assert.isObject(demo3);
				assert.strictEqual(demo3.id, 'example-no-html');
				assert.strictEqual(demo3.title, 'Example No-HTML Demo');
				assert.strictEqual(demo3.description, 'This is an example demo without HTML to be displayed');
				assert.isObject(demo3.supportingUrls);
				assert.strictEqual(demo3.supportingUrls.live, 'https://www.ft.com/__origami/service/build/v2/demos/o-mock-component@1.0.0/example-no-html?brand=core');
				assert.isNull(demo3.supportingUrls.html);
				assert.deepEqual(demo3.display, {
					live: true,
					html: false
				});

				const demo4 = response[3];
				assert.isObject(demo4);
				assert.strictEqual(demo4.id, 'example-branded-demo');
				assert.strictEqual(demo4.title, 'Example Branded Demo');
				assert.strictEqual(demo4.description, 'This is an example demo for the "example-brand" brand');
				assert.isObject(demo4.supportingUrls);
				assert.strictEqual(demo4.supportingUrls.live, 'https://www.ft.com/__origami/service/build/v2/demos/o-mock-component@1.0.0/example-branded-demo?brand=core');
				assert.strictEqual(demo4.supportingUrls.html, 'https://www.ft.com/__origami/service/build/v2/demos/o-mock-component@1.0.0/example-branded-demo/html?brand=core');
				assert.deepEqual(demo4.display, {
					live: true,
					html: true
				});

			});

		});

		describe('when the `brand` query parameter is set', () => {
			let request;

			beforeEach(async () => {
				await database.seed(app, 'basic');
				request = agent
					.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/5bdc1cb5-19f1-4afe-883b-83c822fbbde0/demos?brand=example-brand')
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

				it('is the expected version demos filtered by brand', () => {
					assert.isArray(response);
					assert.lengthEquals(response, 4);

					const demo1 = response[0];
					assert.isObject(demo1);
					assert.strictEqual(demo1.title, 'Example Demo 1');

					const demo2 = response[1];
					assert.isObject(demo2);
					assert.strictEqual(demo2.title, 'Example Demo 2');

					const demo3 = response[2];
					assert.isObject(demo3);
					assert.strictEqual(demo3.title, 'Example No-HTML Demo');

					const demo4 = response[3];
					assert.isObject(demo4);
					assert.strictEqual(demo4.title, 'Example Branded Demo');

				});

			});

		});

		describe('when the `brand` query parameter is set which should filter out demos', () => {
			let request;

			beforeEach(async () => {
				await database.seed(app, 'basic');
				request = agent
					.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/5bdc1cb5-19f1-4afe-883b-83c822fbbde0/demos?brand=notabrand')
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

				it('is the expected version demos filtered by brand', () => {
					assert.isArray(response);
					assert.lengthEquals(response, 3);

					const demo1 = response[0];
					assert.isObject(demo1);
					assert.strictEqual(demo1.title, 'Example Demo 1');

					const demo2 = response[1];
					assert.isObject(demo2);
					assert.strictEqual(demo2.title, 'Example Demo 2');

					const demo3 = response[2];
					assert.isObject(demo3);
					assert.strictEqual(demo3.title, 'Example No-HTML Demo');

				});

			});

		});

		describe('when the `brand` query parameter is invalid (non-alphanumeric + dashes)', () => {
			let request;

			beforeEach(async () => {
				await database.seed(app, 'basic');
				request = agent
					.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/5bdc1cb5-19f1-4afe-883b-83c822fbbde0/demos?brand=no£special>chars')
					.set('X-Api-Key', 'mock-read-key')
					.set('X-Api-Secret', 'mock-read-secret');
			});

			it('responds with a 400 status', () => {
				return request.expect(400);
			});
		});

		describe('when :repoId is not a valid repo ID', () => {
			let request;

			beforeEach(async () => {
				await database.seed(app, 'basic');
				request = agent
					.get('/v1/repos/not-an-id/versions/5bdc1cb5-19f1-4afe-883b-83c822fbbde0/demos')
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
					.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/not-an-id/demos')
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

		describe('when the version does not have any demos', () => {
			let request;

			beforeEach(async () => {
				await database.seed(app, 'basic');
				request = agent
					.get('/v1/repos/855d47ce-697e-51b9-9882-0c3c9044f0f5/versions/3731599a-f6a0-4856-8f28-9d10bc567d5b/demos')
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
					.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/3731599a-f6a0-4856-8f28-9d10bc567d5b/demos')
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
	});

	describe('for a spec v2 component version', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/68d9d7dd-fb52-4b27-bb5c-ff303b2da50c/demos');
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

			it('is the version demos with normalisation applied for v3 of the Build Service', () => {
				assert.isArray(response);
				assert.lengthEquals(response, 4);

				const demo1 = response[0];
				assert.strictEqual(demo1.supportingUrls.live, 'https://www.ft.com/__origami/service/build/v3/demo?component=o-mock-component%403.0.0&demo=example1&system_code=origami-repo-data&brand=core');
				assert.strictEqual(demo1.supportingUrls.html, 'https://www.ft.com/__origami/service/build/v3/demo/html?component=o-mock-component%403.0.0&demo=example1&system_code=origami-repo-data&brand=core');

				const demo2 = response[1];
				assert.strictEqual(demo2.supportingUrls.live, 'https://www.ft.com/__origami/service/build/v3/demo?component=o-mock-component%403.0.0&demo=example2&system_code=origami-repo-data&brand=core');
				assert.strictEqual(demo2.supportingUrls.html, 'https://www.ft.com/__origami/service/build/v3/demo/html?component=o-mock-component%403.0.0&demo=example2&system_code=origami-repo-data&brand=core');

				const demo3 = response[2];
				assert.strictEqual(demo3.supportingUrls.live, 'https://www.ft.com/__origami/service/build/v3/demo?component=o-mock-component%403.0.0&demo=example-no-html&system_code=origami-repo-data&brand=core');
				assert.isNull(demo3.supportingUrls.html);

				const demo4 = response[3];
				assert.strictEqual(demo4.supportingUrls.live, 'https://www.ft.com/__origami/service/build/v3/demo?component=o-mock-component%403.0.0&demo=example-branded-demo&system_code=origami-repo-data&brand=core');
				assert.strictEqual(demo4.supportingUrls.html, 'https://www.ft.com/__origami/service/build/v3/demo/html?component=o-mock-component%403.0.0&demo=example-branded-demo&system_code=origami-repo-data&brand=core');

			});

		});

	});
});
