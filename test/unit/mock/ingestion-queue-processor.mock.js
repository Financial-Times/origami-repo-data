'use strict';

const sinon = require('sinon');

const IngestionQueueProcessor = module.exports = sinon.stub();

const mockIngestionQueueProcessor = module.exports.mockIngestionQueueProcessor = {
	start: sinon.spy()
};

IngestionQueueProcessor.returns(mockIngestionQueueProcessor);
