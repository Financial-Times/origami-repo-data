/* global agent, app */
'use strict';

const database = require('../helpers/database');
const assert = require('proclaim');

describe('GET /v1/repos/:repoId/versions', () => {
	let request;

	beforeEach(async () => {
		await database.seed(app, 'basic');
		request = agent.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions');
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

		it('is an array of all the versions for then given repository', () => {
			assert.isArray(response);
			assert.lengthEquals(response, 6);

			const version1 = response[0];
			assert.isObject(version1);
			assert.strictEqual(version1.id, 'dbd71199-c1ab-4482-9988-eee350b3bdca');
			assert.strictEqual(version1.name, 'o-mock-component');
			assert.strictEqual(version1.version, '3.0.0-beta.1');
			assert.strictEqual(version1.versionTag, 'v3.0.0-beta.1');
			assert.strictEqual(version1.origamiVersion, '1');

			const version2 = response[1];
			assert.isObject(version2);
			assert.strictEqual(version2.id, '68d9d7dd-fb52-4b27-bb5c-ff303b2da50c');
			assert.strictEqual(version2.name, 'o-mock-component');
			assert.strictEqual(version2.version, '3.0.0');
			assert.strictEqual(version2.versionTag, 'v3.0.0');
			assert.strictEqual(version2.origamiVersion, '2.0');

			const version3 = response[2];
			assert.isObject(version3);
			assert.strictEqual(version3.id, '9e4e450d-3b70-4672-b459-f297d434add6');
			assert.strictEqual(version3.name, 'o-mock-component');
			assert.strictEqual(version3.version, '2.0.0');
			assert.strictEqual(version3.versionTag, 'v2.0.0');
			assert.strictEqual(version3.origamiVersion, '1');

			const version4 = response[3];
			assert.isObject(version4);
			assert.strictEqual(version4.id, 'b2bdfae1-cc6f-4433-9a2f-8a4b762cda71');
			assert.strictEqual(version4.name, 'o-mock-component');
			assert.strictEqual(version4.version, '1.1.0');
			assert.strictEqual(version4.versionTag, 'v1.1.0');
			assert.strictEqual(version4.origamiVersion, '1');

			const version5 = response[4];
			assert.isObject(version5);
			assert.strictEqual(version5.id, '5bdc1cb5-19f1-4afe-883b-83c822fbbde0');
			assert.strictEqual(version5.name, 'o-mock-component');
			assert.strictEqual(version5.version, '1.0.0');
			assert.strictEqual(version5.versionTag, 'v1.0.0');
			assert.strictEqual(version5.origamiVersion, '1');

			const version6 = response[5];
			assert.isObject(version6);
			assert.strictEqual(version6.id, '567fa7fa-d79e-46d9-a698-d61ab6a09399');
			assert.strictEqual(version6.name, 'o-mock-component');
			assert.strictEqual(version6.version, '1.0.0');
			assert.strictEqual(version6.versionTag, '1.0.0');
			assert.strictEqual(version6.origamiVersion, '1');
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
