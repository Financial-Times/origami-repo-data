'use strict';

const sinon = require('sinon');

const morgan = module.exports = sinon.stub();
morgan.token = sinon.spy();
morgan.combined = 'mock-combined-log-format';

const mockMiddleware = morgan.mockMiddleware = sinon.stub();

morgan.returns(mockMiddleware);
