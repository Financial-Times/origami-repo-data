'use strict';

const GitHubApiClient = require('github');

// A simple wrapper with some convenience methods
module.exports = class GitHubClient {

	constructor(githubAuthToken) {
		this.client = new GitHubApiClient();
		if (githubAuthToken) {
			this.client.authenticate({
				type: 'oauth',
				token: githubAuthToken
			});
		}
	}

	extractRepoFromUrl(url) {
		const [, , owner, repo] = url.match(module.exports.githubUrlRegexp);
		return {owner, repo};
	}

	isValidUrl(url) {
		return module.exports.githubUrlRegexp.test(url);
	}

	async isValidRepoAndTag({owner, repo, tag}) {
		try {
			await this.client.gitdata.getReference({
				owner,
				repo,
				ref: `tags/${tag}`
			});
			return true;
		} catch (error) {
			if (error.code === 404) {
				return false;
			}
			throw error;
		}
	}

	async loadReadme(options) {
		try {
			const response = await this.client.repos.getReadme(options);
			return Buffer.from(response.data.content, 'base64').toString();
		} catch (error) {
			if (error.code === 404) {
				return null;
			}
			throw error;
		}
	}

	async loadFile(options) {
		try {
			const response = await this.client.repos.getContent(options);
			return Buffer.from(response.data.content, 'base64').toString();
		} catch (error) {
			if (error.code === 404) {
				return null;
			}
			throw error;
		}
	}

	async loadJsonFile(options) {
		return JSON.parse(await this.loadFile(options));
	}

	error(message, recoverable = true) {
		const error = new Error(message);
		error.isRecoverable = recoverable;
		return error;
	}

};

module.exports.githubUrlRegexp = /^https?:\/\/(www\.)?github.com\/([^\/]+)\/([^\/]+)\/?/i;
