'use strict';

const dotenv = require('dotenv');
const service = require('../..');
const supertest = require('supertest');

const noop = () => {};
const mockLog = {
	info: noop,
	error: noop,
	warn: noop
};

before(async () => {

	dotenv.config();

	const app = global.app = service({
		buildServiceUrl: 'https://www.ft.com/__origami/service/build',
		database: process.env.TEST_DATABASE || 'postgres://localhost:5432/origami-repo-data-test',
		githubAuthToken: process.env.GITHUB_AUTH_TOKEN,
		npmRegistryUrl: 'https://registry.npmjs.org/',
		disableIngestionQueue: true,
		environment: 'test',
		log: mockLog,
		port: process.env.TEST_PORT || 0,
		requestLogFormat: null
	});
	await app.listen();
	global.agent = supertest.agent(app);
});

after(() => {
	if (global.app) {
		global.app.ft.server.close();
		global.app.database.knex.destroy(() => {
			// This is temporary, we need to debug why the process
			// is being held open
			process.exit(0);
		});
	}
});
