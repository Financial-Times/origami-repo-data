/* global agent, app */
'use strict';

const database = require('../helpers/database');
const assert = require('proclaim');

describe('GET /v1/repos/:repoId/versions/:versionId/images', () => {
	let request;

	beforeEach(async () => {
		await database.seed(app, 'basic');
		request = agent.get('/v1/repos/833bf423-4952-53e7-8fc0-e9e8554caf77/versions/ecd0f3c7-dac8-4354-95e0-cb9c0cd686ea/images');
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

		it('is the version images with some normalisation applied', () => {
			assert.isArray(response);
			assert.lengthEquals(response, 2);

			const image1 = response[0];
			assert.isObject(image1);
			assert.strictEqual(image1.title, 'example-image-1');
			assert.isObject(image1.supportingUrls);
			assert.strictEqual(image1.supportingUrls.full, 'https://www.ft.com/__origami/service/image/v2/images/raw/ftmock-v1:example-image-1?source=origami-repo-data');
			assert.strictEqual(image1.supportingUrls.w200, 'https://www.ft.com/__origami/service/image/v2/images/raw/ftmock-v1:example-image-1?source=origami-repo-data&width=200');

			const image2 = response[1];
			assert.isObject(image2);
			assert.strictEqual(image2.title, 'example-image-2');
			assert.isObject(image2.supportingUrls);
			assert.strictEqual(image2.supportingUrls.full, 'https://www.ft.com/__origami/service/image/v2/images/raw/ftmock-v1:example-image-2?source=origami-repo-data');
			assert.strictEqual(image2.supportingUrls.w200, 'https://www.ft.com/__origami/service/image/v2/images/raw/ftmock-v1:example-image-2?source=origami-repo-data&width=200');

		});

	});

	describe('when a `sourceParam` query parameter is provided', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.get('/v1/repos/833bf423-4952-53e7-8fc0-e9e8554caf77/versions/ecd0f3c7-dac8-4354-95e0-cb9c0cd686ea/images?sourceParam=mock-source')
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

			it('is the version images with the given source param used in image URLs', () => {
				assert.isArray(response);
				assert.lengthEquals(response, 2);

				const image1 = response[0];
				assert.strictEqual(image1.supportingUrls.full, 'https://www.ft.com/__origami/service/image/v2/images/raw/ftmock-v1:example-image-1?source=mock-source');
				assert.strictEqual(image1.supportingUrls.w200, 'https://www.ft.com/__origami/service/image/v2/images/raw/ftmock-v1:example-image-1?source=mock-source&width=200');

				const image2 = response[1];
				assert.strictEqual(image2.supportingUrls.full, 'https://www.ft.com/__origami/service/image/v2/images/raw/ftmock-v1:example-image-2?source=mock-source');
				assert.strictEqual(image2.supportingUrls.w200, 'https://www.ft.com/__origami/service/image/v2/images/raw/ftmock-v1:example-image-2?source=mock-source&width=200');

			});

		});

	});

	describe('when :repoId is not a valid repo ID', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.get('/v1/repos/not-an-id/versions/ecd0f3c7-dac8-4354-95e0-cb9c0cd686ea/images')
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
				.get('/v1/repos/833bf423-4952-53e7-8fc0-e9e8554caf77/versions/not-an-id/images')
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

	describe('when the version does not have any images', () => {
		let request;

		beforeEach(async () => {
			await database.seed(app, 'basic');
			request = agent
				.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/5bdc1cb5-19f1-4afe-883b-83c822fbbde0/images')
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
				.get('/v1/repos/833bf423-4952-53e7-8fc0-e9e8554caf77/versions/3731599a-f6a0-4856-8f28-9d10bc567d5b/images')
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
