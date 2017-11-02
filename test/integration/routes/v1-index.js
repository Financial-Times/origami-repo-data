/* global agent, app */
'use strict';

const database = require('../helpers/database');

describe('GET /v1', () => {
	let request;

	beforeEach(async () => {
		await database.destroy(app);
		request = agent.get('/v1');
	});

	it('responds with a 200 status', () => {
		return request.expect(200);
	});

	it('responds with HTML', () => {
		return request.expect('Content-Type', /text\/html/);
	});

});
