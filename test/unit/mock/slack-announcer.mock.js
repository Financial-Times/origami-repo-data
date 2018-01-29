'use strict';

const sinon = require('sinon');

const SlackAnnouncer = module.exports = sinon.stub();

const mockSlackAnnouncer = module.exports.mockSlackAnnouncer = {};

SlackAnnouncer.returns(mockSlackAnnouncer);
