'use strict';

const SlackWebApiClient = require('@slack/web-api').WebClient;
const getChangelogSection = require('get-changelog-section');

// Announce new repo versions in Slack
module.exports = class SlackAnnouncer {

	constructor({authToken, channelId, log}) {
		this.client = new SlackWebApiClient(authToken);
		this.channelId = channelId;
		this.log = log;
	}

	async announce(version) {

		const name = version.get('name');
		const type = version.get('type');
		const versionNumber = version.get('version');
		const supportStatus = version.get('support_status');
		const isOrigami = version.get('support_is_origami');
		const changelog = version.get('changelog');

		if (supportStatus !== 'active' && supportStatus !== 'maintained') {
			this.log.info(`Slack Announcer: type="ignore" repo="${name}" version="${versionNumber}" message="Support status is not active or maintained"`);
			return;
		}
		if (!isOrigami) {
			this.log.info(`Slack Announcer: type="ignore" repo="${name}" version="${versionNumber}" message="Repo is not maintained by Origami"`);
			return;
		}
		if (type === 'service') {
			this.log.info(`Slack Announcer: type="ignore" repo="${name}" version="${versionNumber}" message="Repo is a service"`);
			return;
		}

		const label = `${name} @ ${versionNumber}`;
		const url = `https://registry.origami.ft.com/components/${name}@${versionNumber}`;
		let text = `New release: *<${url}|${label}>*`;
		if (changelog) {
			const changelogSection = getChangelogSection({markdown: changelog, version: versionNumber});
			if (changelogSection) {
				text += `\n\n${changelogSection}`;
			}
		}
		try {
			await this.client.chat.postMessage({
				channel: this.channelId,
				text,
				as_user: true
			});
			this.log.info(`Slack Announcer: type="success" repo="${name}" version="${versionNumber}"`);
		} catch (error) {
			this.log.error(`Slack Announcer: type="error" repo="${name}" version="${versionNumber}" message="${error.message}"`);
		}

	}

};
