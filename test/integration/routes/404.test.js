/* global agent, app */
'use strict';

const assert = require('proclaim');
const database = require('../helpers/database');

describe('GET /404', () => {
	let request;

	beforeEach(async () => {
		await database.destroy(app);
		request = agent.get('/404');
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
