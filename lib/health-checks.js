'use strict';

const HealthCheck = require('@financial-times/health-check');

module.exports = healthChecks;

function healthChecks(options) {

	// Create and return the health check
	return new HealthCheck({
		checks: [

			// This check ensures that GitHub is available
			// on port 80. It will fail on a bad response
			// or socket timeout
			{
				type: 'ping-url',
				url: 'https://github.com/',
				port: 80,
				interval: 5 * 60 * 1000, // 5 minutes
				id: 'github',
				name: 'Availability of Github',
				severity: 2,
				technicalSummary: 'This will prevent new repositories from being ingested into the service. Any releases created on GitHub during their outage may have to be manually added to the service later.',
				businessImpact: 'The Origami team will have to manually ingest some GitHub releases later.',
				panicGuide: 'Check whether `github.com` loads in a web browser, and check https://status.github.com/ for reported downtime.'
			},

			// This check ensures that the Slack API is
			// available. It will fail on a bad response
			{
				type: 'ping-url',
				url: 'https://slack.com/api/api.test',
				interval: 5 * 60 * 1000, // 5 minutes
				id: 'slack-api',
				name: 'Availability of Slack API',
				severity: 3,
				technicalSummary: 'This will prevent new repository ingestions from being announced on Slack',
				businessImpact: 'The Origami team may have to let users know that a new release is available manually.',
				panicGuide: 'Check whether `slack.com` loads in a web browser, and check https://status.slack.com/ for reported downtime.'
			},

			// This check monitors the process memory usage
			// It will fail if usage is above the threshold
			{
				type: 'memory',
				threshold: 75,
				interval: 15000,
				id: 'system-memory',
				name: 'System memory usage is below 75%',
				severity: 1,
				businessImpact: 'Application may not be able to serve all requests',
				technicalSummary: 'Process has run out of available memory',
				panicGuide: 'Restart the service dynos on Heroku'
			},

			// This check monitors the system CPU usage
			// It will fail if usage is above the threshold
			{
				type: 'cpu',
				threshold: 125,
				interval: 15000,
				id: 'system-load',
				name: 'System CPU usage is below 125%',
				severity: 1,
				businessImpact: 'Application may not be able to serve all requests',
				technicalSummary: 'Process is hitting the CPU harder than expected',
				panicGuide: 'Restart the service dynos on Heroku'
			}

		],
		log: options.log
	});

}
