'use strict';

const sinon = require('sinon');

const webApi = module.exports = {};

const WebClient = webApi.WebClient = sinon.stub();

const mockWebClient = module.exports.mockWebClient = {
	chat: {
		postMessage: sinon.stub().resolves()
	}
};

WebClient.returns(mockWebClient);
