'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/github-client', () => {
	let GitHubApiClient;
	let GitHubClient;

	beforeEach(() => {
		GitHubApiClient = require('../mock/octokit-rest.mock');
		mockery.registerMock('@octokit/rest', GitHubApiClient);

		GitHubClient = require('../../../lib/github-client');
	});

	it('exports a class constructor', () => {
		assert.isFunction(GitHubClient);
		assert.throws(() => GitHubClient(), /constructor githubclient/i); // eslint-disable-line new-cap
	});

	describe('new GitHubClient(githubAuthToken)', () => {
		let instance;

		beforeEach(() => {
			instance = new GitHubClient('mock-auth-token');
		});

		it('has a `client` property set to a new authenticated GitHub API client', () => {
			assert.calledOnce(GitHubApiClient);
			assert.calledWithNew(GitHubApiClient);
			assert.calledWithExactly(GitHubApiClient, {
				auth: 'mock-auth-token'
			});
			assert.strictEqual(instance.client, GitHubApiClient.mockGitHubApiClient);
		});

		describe('.extractRepoFromUrl(url)', () => {

			it('extracts the owner and repo names from a GitHub URL', () => {
				assert.deepEqual(instance.extractRepoFromUrl('https://github.com/mock-owner-1/mock-repo-1'), {
					owner: 'mock-owner-1',
					repo: 'mock-repo-1'
				});
				assert.deepEqual(instance.extractRepoFromUrl('http://www.github.com/mock-owner-2/mock-repo-2'), {
					owner: 'mock-owner-2',
					repo: 'mock-repo-2'
				});
				assert.deepEqual(instance.extractRepoFromUrl('https://github.com/mock-owner-3/mock-repo-3/issues'), {
					owner: 'mock-owner-3',
					repo: 'mock-repo-3'
				});
			});

		});

		describe('.isValidUrl(url)', () => {

			it('returns `true` if `url` is valid', () => {
				assert.isTrue(instance.isValidUrl('https://github.com/mock-owner-1/mock-repo-1'));
				assert.isTrue(instance.isValidUrl('http://www.github.com/mock-owner-2/mock-repo-2'));
				assert.isTrue(instance.isValidUrl('https://github.com/mock-owner-3/mock-repo-3/issues'));
			});

			it('returns `false` if `url` is invalid', () => {
				assert.isFalse(instance.isValidUrl('https://www.google.com'));
				assert.isFalse(instance.isValidUrl('https://github.com/mock-owner-4'));
				assert.isFalse(instance.isValidUrl('git@github.com:mock-owner-5/mock-repo-5.git'));
			});

		});

		describe('.isValidRepoAndTag(options)', () => {
			let returnValue;

			beforeEach(async () => {
				instance.client.gitdata.getRef.resolves();
				returnValue = await instance.isValidRepoAndTag({
					owner: 'mock-owner',
					repo: 'mock-repo',
					tag: 'mock-tag'
				});
			});

			it('makes a GitHub API call', () => {
				assert.calledOnce(instance.client.gitdata.getRef);
				assert.calledWithExactly(instance.client.gitdata.getRef, {
					owner: 'mock-owner',
					repo: 'mock-repo',
					ref: 'tags/mock-tag'
				});
			});

			it('resolves with `true`', () => {
				assert.isTrue(returnValue);
			});

			describe('when the repo/tag combination is not valid', () => {
				let githubError;

				beforeEach(async () => {
					githubError = new Error('mock error');
					githubError.status = 404;
					instance.client.gitdata.getRef.rejects(githubError);
					returnValue = await instance.isValidRepoAndTag({
						owner: 'mock-owner',
						repo: 'mock-repo',
						tag: 'mock-tag'
					});
				});

				it('resolves with `false`', () => {
					assert.isFalse(returnValue);
				});

			});

			describe('when the GitHub API errors', () => {
				let caughtError;
				let githubError;

				beforeEach(async () => {
					githubError = new Error('mock error');
					instance.client.gitdata.getRef.rejects(githubError);
					try {
						await instance.isValidRepoAndTag({
							owner: 'mock-owner',
							repo: 'mock-repo',
							tag: 'mock-tag'
						});
					} catch (error) {
						caughtError = error;
					}
				});

				it('rejects with the error', () => {
					assert.strictEqual(caughtError, githubError);
				});

			});

		});

		describe('.loadReadme(options)', () => {
			let returnValue;

			beforeEach(async () => {
				instance.client.repos.getReadme.resolves({
					data: {
						content: new Buffer('mock-readme-content').toString('base64')
					}
				});
				returnValue = await instance.loadReadme('mock-options');
			});

			it('makes a GitHub API call', () => {
				assert.calledOnce(instance.client.repos.getReadme);
				assert.calledWithExactly(instance.client.repos.getReadme, 'mock-options');
			});

			it('resolves with the decoded README contents', () => {
				assert.strictEqual(returnValue, 'mock-readme-content');
			});

			describe('when the repo does not have a README', () => {
				let githubError;

				beforeEach(async () => {
					githubError = new Error('mock error');
					githubError.status = 404;
					instance.client.repos.getReadme.rejects(githubError);
					returnValue = await instance.loadReadme('mock-options');
				});

				it('resolves with `null`', () => {
					assert.isNull(returnValue);
				});

			});

			describe('when the GitHub API errors', () => {
				let caughtError;
				let githubError;

				beforeEach(async () => {
					githubError = new Error('mock error');
					instance.client.repos.getReadme.rejects(githubError);
					try {
						await instance.loadReadme('mock-options');
					} catch (error) {
						caughtError = error;
					}
				});

				it('rejects with the error', () => {
					assert.strictEqual(caughtError, githubError);
				});

			});

		});

		describe('.loadFile(options)', () => {
			let returnValue;

			beforeEach(async () => {
				instance.client.repos.getContents.resolves({
					data: {
						content: new Buffer('mock-file-content').toString('base64')
					}
				});
				returnValue = await instance.loadFile('mock-options');
			});

			it('makes a GitHub API call', () => {
				assert.calledOnce(instance.client.repos.getContents);
				assert.calledWithExactly(instance.client.repos.getContents, 'mock-options');
			});

			it('resolves with the decoded file contents', () => {
				assert.strictEqual(returnValue, 'mock-file-content');
			});

			describe('when the repo does not have the requested file', () => {
				let githubError;

				beforeEach(async () => {
					githubError = new Error('mock error');
					githubError.status = 404;
					instance.client.repos.getContents.rejects(githubError);
					returnValue = await instance.loadFile('mock-options');
				});

				it('resolves with `null`', () => {
					assert.isNull(returnValue);
				});

			});

			describe('when the GitHub API errors', () => {
				let caughtError;
				let githubError;

				beforeEach(async () => {
					githubError = new Error('mock error');
					instance.client.repos.getContents.rejects(githubError);
					try {
						await instance.loadFile('mock-options');
					} catch (error) {
						caughtError = error;
					}
				});

				it('rejects with the error', () => {
					assert.strictEqual(caughtError, githubError);
				});

			});

		});

		describe('.loadJsonFile(options)', () => {
			let returnValue;

			beforeEach(async () => {
				instance.loadFile = sinon.stub().resolves('{"foo": "bar"}');
				returnValue = await instance.loadJsonFile('mock-options');
			});

			it('loads the file', () => {
				assert.calledOnce(instance.loadFile);
				assert.calledWithExactly(instance.loadFile, 'mock-options');
			});

			it('resolves with the file contents parsed as JSON', () => {
				assert.deepEqual(returnValue, {
					foo: 'bar'
				});
			});

		});

		describe('.error(message, recoverable)', () => {
			let returnValue;

			beforeEach(() => {
				returnValue = instance.error('mock-message', false);
			});

			it('returns an Error instance with the given message and an `isRecoverable` property', () => {
				assert.instanceOf(returnValue, Error);
				assert.strictEqual(returnValue.message, 'mock-message');
				assert.isFalse(returnValue.isRecoverable);
			});

			describe('when `recoverable` is undefined', () => {

				beforeEach(() => {
					returnValue = instance.error('mock-message');
				});

				it('defaults the `isRecoverable` property to `true`', () => {
					assert.isTrue(returnValue.isRecoverable);
				});

			});

		});

		describe('when `githubAuthToken` is not defined', () => {

			beforeEach(() => {
				GitHubApiClient.resetHistory();
				instance = new GitHubClient();
			});

			it('does not authenticate the API client', () => {
				assert.calledOnce(GitHubApiClient);
				assert.calledWithNew(GitHubApiClient);
				assert.calledWithExactly(GitHubApiClient, {});
			});

		});

	});

});
