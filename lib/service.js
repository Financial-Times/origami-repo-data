'use strict';

const bookshelf = require('bookshelf');
const GitHubClient = require('./github-client');
const healthChecks = require('./health-checks');
const IngestionQueueProcessor = require('./ingestion-queue-processor');
const knex = require('knex');
const morgan = require('morgan');
const origamiService = require('@financial-times/origami-service');
const requireAll = require('require-all');
const SlackAnnouncer = require('./slack-announcer');
const url = require('url');

module.exports = service;

function service(options) {

	const health = healthChecks(options);
	options.healthCheck = health.checks();
	options.goodToGoTest = health.gtg();
	options.about = require('../about.json');
	options.defaultLayout = 'main';

	// Add an auth token to Morgan, for logging safe authentication details (no secrets)
	morgan.token('auth', (request, response, field = 'id') => {
		return (request.authenticatedKey ? request.authenticatedKey.get(field) : 'none');
	});

	// Replace the default Morgan URL token, as this exposes API keys and secrets in the querystring.
	// The original is here: https://github.com/expressjs/morgan/blob/b29fc884dd836960fabe65fe71db988bcb867371/index.js#L212
	morgan.token('url', request => {
		const mask = 'XXXXX';
		const requestUrl = url.parse(request.originalUrl || request.url, true);
		if (requestUrl.query.apiKey) {
			requestUrl.query.apiKey = mask;
		}
		if (requestUrl.query.apiSecret) {
			requestUrl.query.apiSecret = mask;
		}
		// In order to use the `query` object in URL formatting, we need to delete the `search` property:
		// https://nodejs.org/docs/latest/api/url.html#url_url_format_urlobject
		delete requestUrl.search;
		return url.format(requestUrl);
	});

	if (options.requestLogFormat === undefined) {
		options.requestLogFormat = `${morgan.combined} auth=":auth/:auth[description]"`;
	}

	const app = origamiService(options);

	app.use(origamiService.middleware.getBasePath());
	mountRoutes(app);
	app.use(origamiService.middleware.notFound());
	app.use(origamiService.middleware.errorHandler({
		outputJson: true
	}));

	app.database = bookshelf(knex({
		client: 'pg',
		connection: options.database
	}));
	app.database.plugin('virtuals');
	app.model = {};
	loadModels(app);

	app.github = new GitHubClient(options.githubAuthToken);

	app.slackAnnouncer = new SlackAnnouncer({
		authToken: options.slackAnnouncerAuthToken,
		channelId: options.slackAnnouncerChannelId,
		log: app.ft.log
	});

	app.ingestionQueueProcessor = new IngestionQueueProcessor(app);
	if (!options.disableIngestionQueue) {
		app.ingestionQueueProcessor.start();
	}

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
