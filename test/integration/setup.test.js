'use strict';

const service = require('../..');
const supertest = require('supertest');

const noop = () => {};
const mockLog = {
	info: noop,
	error: noop,
	warn: noop
};

before(async () => {
	const app = global.app = service({
		database: process.env.TEST_DATABASE || 'postgres://localhost:5432/origami-repo-data-test',
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
		const connectionPool = global.app.database.knex.client.pool;
		connectionPool.drain(connectionPool.destroyAllNow);
	}
});
