'use strict';

const sinon = require('sinon');

const GitHubClient = module.exports = sinon.stub();

const mockGitHubClient = module.exports.mockGitHubClient = {
	isMockGitHubClient: true
};

GitHubClient.returns(mockGitHubClient);
