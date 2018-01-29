'use strict';

const dotenv = require('dotenv');
const service = require('./lib/service');
const throng = require('throng');

dotenv.load();

const options = {
	database: process.env.DATABASE_URL || 'postgres://localhost:5432/origami-repo-data',
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
