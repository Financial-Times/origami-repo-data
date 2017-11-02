/* global agent, app */
'use strict';

const database = require('../helpers/database');

describe('GET /', () => {
	let request;

	beforeEach(async () => {
		await database.destroy(app);
		request = agent.get('/');
	});

	it('responds with a 301 status', () => {
		return request.expect(301);
	});

	it('responds with a Location header', () => {
		return request.expect('Location', '/v1');
	});

});
