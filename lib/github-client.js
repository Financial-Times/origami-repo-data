'use strict';

const GitHubApiClient = require('@octokit/rest');

// A simple wrapper with some convenience methods
module.exports = class GitHubClient {

	constructor(githubAuthToken) {
		const options = {};
		if (githubAuthToken) {
			options.auth = githubAuthToken;
		}
		this.client = new GitHubApiClient(options);
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
			await this.client.gitdata.getRef({
				owner,
				repo,
				ref: `tags/${tag}`
			});
			return true;
		} catch (error) {
			if (error.status === 404) {
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
			if (error.status === 404) {
				return null;
			}
			throw error;
		}
	}

	async loadFile(options) {
		try {
			const response = await this.client.repos.getContents(options);
			return Buffer.from(response.data.content, 'base64').toString();
		} catch (error) {
			if (error.status === 404) {
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
