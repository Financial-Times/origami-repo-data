'use strict';

const sinon = require('sinon');

const GitHubApiClient = module.exports = sinon.stub();

const mockGitHubApiClient = module.exports.mockGitHubApiClient = {
	authenticate: sinon.stub(),
	gitdata: {
		getReference: sinon.stub()
	},
	repos: {
		getContent: sinon.stub(),
		getReadme: sinon.stub()
	}
};

GitHubApiClient.returns(mockGitHubApiClient);
