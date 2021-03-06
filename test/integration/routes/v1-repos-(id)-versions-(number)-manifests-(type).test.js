/* global agent, app */
'use strict';

const database = require('../helpers/database');

describe('GET /v1/repos/:repoId/versions/:versionNumber/manifests/:manifestType', () => {
	let request;

	beforeEach(async () => {
		await database.seed(app, 'basic');
		request = agent
			.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/v1.0.0/manifests/origami')
			.set('X-Api-Key', 'mock-read-key')
			.set('X-Api-Secret', 'mock-read-secret');
	});

	it('responds with a 307 status', () => {
		return request.expect(307);
	});

	it('responds with a Location header pointing to the ID-based endpoint', () => {
		return request.expect('Location', '/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/5bdc1cb5-19f1-4afe-883b-83c822fbbde0/manifests/origami');
	});

	it('responds with text', () => {
		return request.expect('Content-Type', /text\/plain/);
	});

});
