'use strict';

const dotenv = require('dotenv');
const service = require('./lib/service');
const throng = require('throng');

dotenv.load();

// Work out where the database URL is
// (work with Heroku Postgres color named databases)
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	for (const [key, value] of Object.entries(process.env)) {
		if (/^HEROKU_POSTGRESQL_[^_]+_URL$/.test(key)) {
			databaseUrl = value;
			break;
		}
	}
}
if (!databaseUrl) {
	databaseUrl = 'postgres://localhost:5432/origami-repo-data';
}

const options = {
	database: databaseUrl,
	githubAuthToken: process.env.GITHUB_AUTH_TOKEN,
	log: console,
	name: 'Origami Repo Data',
	workers: process.env.WEB_CONCURRENCY || 1,
	enableSetupStep: !!process.env.ENABLE_SETUP_STEP,
	slackAnnouncerAuthToken: process.env.SLACK_ANNOUNCER_AUTH_TOKEN,
	slackAnnouncerChannelId: process.env.SLACK_ANNOUNCER_CHANNEL_ID
};

throng({
	workers: options.workers,
	start: startWorker
});

function startWorker(id) {
	console.log(`Started worker ${id}`);
	service(options).listen().catch(() => {
		process.exit(1);
	});
}
