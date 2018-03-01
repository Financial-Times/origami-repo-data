'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/slack-announcer', () => {
	let log;
	let SlackClient;
	let SlackAnnouncer;

	beforeEach(() => {

		log = require('../mock/log.mock');

		SlackClient = require('../mock/slack-client.mock');
		mockery.registerMock('@slack/client', SlackClient);

		SlackAnnouncer = require('../../../lib/slack-announcer');
	});

	it('exports a class constructor', () => {
		assert.isFunction(SlackAnnouncer);
		assert.throws(() => SlackAnnouncer(), /constructor slackannouncer/i); // eslint-disable-line new-cap
	});

	describe('new SlackAnnouncer(options)', () => {
		let instance;
		let options;

		beforeEach(() => {
			options = {
				authToken: 'mock-auth-token',
				channelId: 'mock-channel-id',
				log: log
			};
			instance = new SlackAnnouncer(options);
		});

		it('has a `client` property set to a new Slack Web API client authenticated with `options.authToken`', () => {
			assert.calledOnce(SlackClient.WebClient);
			assert.calledWithNew(SlackClient.WebClient);
			assert.calledWithExactly(SlackClient.WebClient, 'mock-auth-token');
			assert.strictEqual(instance.client, SlackClient.mockWebClient);
		});

		it('has a `channelId` property set to `options.channelId`', () => {
			assert.strictEqual(instance.channelId, 'mock-channel-id');
		});

		it('has a `log` property set to `options.log`', () => {
			assert.strictEqual(instance.log, log);
		});

		describe('.announce(version)', () => {
			let returnValue;
			let version;

			beforeEach(async () => {
				version = {
					get: sinon.stub()
				};
				version.get.withArgs('name').returns('mock-name');
				version.get.withArgs('type').returns('module');
				version.get.withArgs('version').returns('mock-version');
				version.get.withArgs('support_status').returns('active');
				version.get.withArgs('support_is_origami').returns(true);
				returnValue = await instance.announce(version);
			});

			it('posts an announcement to the Slack channel', () => {
				assert.calledOnce(instance.client.chat.postMessage);
				assert.calledWithExactly(
					instance.client.chat.postMessage,
					'mock-channel-id',
					'New release: *<https://origami-registry.ft.com/components/mock-name@mock-version|mock-name @ mock-version>*',
					{as_user: true}
				);
			});

			it('returns nothing', () => {
				assert.isUndefined(returnValue);
			});

			describe('when the version support status is not active or maintained', () => {

				beforeEach(async () => {
					instance.client.chat.postMessage.resetHistory();
					version.get.withArgs('support_status').returns('deprecated');
					returnValue = await instance.announce(version);
				});

				it('does not post an announcement to the Slack channel', () => {
					assert.notCalled(instance.client.chat.postMessage);
				});

				it('returns nothing', () => {
					assert.isUndefined(returnValue);
				});

			});

			describe('when the version is not maintained by Origami', () => {

				beforeEach(async () => {
					instance.client.chat.postMessage.resetHistory();
					version.get.withArgs('support_is_origami').returns(false);
					returnValue = await instance.announce(version);
				});

				it('does not post an announcement to the Slack channel', () => {
					assert.notCalled(instance.client.chat.postMessage);
				});

				it('returns nothing', () => {
					assert.isUndefined(returnValue);
				});

			});

			describe('when the version is a service', () => {

				beforeEach(async () => {
					instance.client.chat.postMessage.resetHistory();
					version.get.withArgs('type').returns('service');
					returnValue = await instance.announce(version);
				});

				it('does not post an announcement to the Slack channel', () => {
					assert.notCalled(instance.client.chat.postMessage);
				});

				it('returns nothing', () => {
					assert.isUndefined(returnValue);
				});

			});

			describe('when the message posting fails', () => {
				let caughtError;
				let slackError;

				beforeEach(async () => {
					slackError = new Error('mock-slack-error');
					instance.client.chat.postMessage.rejects(slackError);
					try {
						returnValue = await instance.announce(version);
					} catch (error) {
						caughtError = error;
					}
				});

				it('does not throw an error', () => {
					assert.isUndefined(caughtError);
				});

				it('returns nothing', () => {
					assert.isUndefined(returnValue);
				});

			});

		});

	});

});
