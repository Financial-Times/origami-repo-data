/* global agent, app */
'use strict';

const database = require('../helpers/database');

describe('GET /v1/repos/:repoName', () => {
	let request;

	beforeEach(async () => {
		await database.seed(app, 'basic');
		request = agent
			.get('/v1/repos/o-mock-component')
			.set('X-Api-Key', 'mock-read-key')
			.set('X-Api-Secret', 'mock-read-secret');
	});

	it('responds with a 307 status', () => {
		return request.expect(307);
	});

	it('responds with a Location header pointing to the ID-based endpoint', () => {
		return request.expect('Location', '/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d');
	});

	it('responds with text', () => {
		return request.expect('Content-Type', /text\/plain/);
	});

});
