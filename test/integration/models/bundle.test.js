/* global app */
'use strict';

const database = require('../helpers/database');
const nock = require('nock');
const assert = require('proclaim');

describe('Bundle', () => {

	const testRepoId = 'c990cb4b-c82b-5071-afb0-16149debc53d';
	const testRepoName = 'o-mock-component';
	const v1SpecRelease = '2.0.0';
	const v2SpecRelease = '3.0.0';

	const mockData = [
		{
			brand: 'master',
			lang: 'css',
			contentLength: 500,
			v2Path: `/v2/bundles/css?modules=${testRepoName}%40${v1SpecRelease}&brand=master`,
			v3Path: `/v3/bundles/css?components=%40financial-times%2F${testRepoName}%40${v2SpecRelease}&system_code=origami-repo-data&brand=master`
		},
		{
			brand: 'internal',
			lang: 'css',
			contentLength: 300,
			v2Path: `/v2/bundles/css?modules=${testRepoName}%40${v1SpecRelease}&brand=internal`,
			v3Path: `/v3/bundles/css?components=%40financial-times%2F${testRepoName}%40${v2SpecRelease}&system_code=origami-repo-data&brand=internal`
		},
		{
			brand: null,
			lang: 'js',
			contentLength: 200,
			v2Path: `/v2/bundles/js?modules=${testRepoName}%40${v1SpecRelease}`,
			v3Path: `/v3/bundles/js?components=%40financial-times%2F${testRepoName}%40${v2SpecRelease}&system_code=origami-repo-data`
		}
	];

	beforeEach(async () => {
		await database.seed(app, 'basic');

		nock('https://www.ft.com')
			.persist()
			.head(uri => uri.includes('bundles'))
			.reply(function (uri) {
				const url = new URL(this.req.options.href);
				const { lang } = uri.match(/bundles\/(?<lang>[a-z]*)/).groups;
				const brand = url.searchParams.get('brand');
				const result = mockData.find(d =>
					d.brand === brand &&
					d.lang === lang
				);
				return [
					200,
					'',
					{
						'Content-Length': result.contentLength
					}
				];
			});
	});

	afterEach(async () => {
		await database.destroy(app);
	});


	describe('updateBundlesForVersion', () => {
		it('saves new bundles for a v1 Origami component', async () => {
			const v1Version = await app.model.Version.fetchByRepoIdAndVersionNumber(
				testRepoId,
				v1SpecRelease
			);
			const Bundle = app.model.Bundle;
			await Bundle.updateBundlesForVersion(v1Version);

			for (const { brand, lang, contentLength, v2Path } of mockData) {
				const bundle = await Bundle.fetchUnique(
					v1Version.get('id'),
					lang,
					brand
				);
				assert.equal(bundle.get('sizes').raw, contentLength);
				assert.include(bundle.get('url'), v2Path);
			}
		});


		it('saves new bundles for a v2 Origami component', async () => {
			const v2Version = await app.model.Version.fetchByRepoIdAndVersionNumber(
				testRepoId,
				v2SpecRelease
			);
			const Bundle = app.model.Bundle;
			await Bundle.updateBundlesForVersion(v2Version);

			for (const { brand, lang, contentLength, v3Path } of mockData) {
				const bundle = await Bundle.fetchUnique(
					v2Version.get('id'),
					lang,
					brand
				);
				assert.equal(bundle.get('sizes').raw, contentLength);
				assert.include(bundle.get('url'), v3Path);
			}
		});
	});
});
