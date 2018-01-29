'use strict';

const sinon = require('sinon');

const SlackClient = module.exports = {};

const WebClient = SlackClient.WebClient = sinon.stub();

const mockWebClient = module.exports.mockWebClient = {
	chat: {
		postMessage: sinon.stub().resolves()
	}
};

WebClient.returns(mockWebClient);
