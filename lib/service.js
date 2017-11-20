'use strict';

const bookshelf = require('bookshelf');
const healthChecks = require('./health-checks');
const IngestionQueueProcessor = require('./ingestion-queue-processor');
const knex = require('knex');
const morgan = require('morgan');
const origamiService = require('@financial-times/origami-service');
const requireAll = require('require-all');

module.exports = service;

function service(options) {

	const health = healthChecks(options);
	options.healthCheck = health.checks();
	options.goodToGoTest = health.gtg();
	options.about = require('../about.json');
	options.defaultLayout = 'main';

	morgan.token('auth', (request, response, field = 'id') => {
		return (request.authenticatedKey ? request.authenticatedKey.get(field) : 'none');
	});
	options.requestLogFormat = `${morgan.combined} auth=":auth/:auth[description]"`;

	const app = origamiService(options);

	app.use(origamiService.middleware.getBasePath());
	mountRoutes(app);
	app.use(origamiService.middleware.notFound());
	app.use(origamiService.middleware.errorHandler());

	app.database = bookshelf(knex({
		client: 'pg',
		connection: options.database
	}));
	app.database.plugin('virtuals');
	app.model = {};
	loadModels(app);

	app.ingestionQueueProcessor = new IngestionQueueProcessor(app);
	app.ingestionQueueProcessor.start();

	return app;
}

function mountRoutes(app) {
	requireAll({
		dirname: `${__dirname}/routes`,
		resolve: initRoute => initRoute(app)
	});
}

function loadModels(app) {
	requireAll({
		dirname: `${__dirname}/../models`,
		resolve: initModel => initModel(app)
	});
}
