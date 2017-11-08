/* global agent, app */
'use strict';

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

	it('responds with HTML', () => {
		return request.expect('Content-Type', /text\/html/);
	});

});
