/* global agent, app */
'use strict';

const assert = require('proclaim');
const database = require('../helpers/database');
const seed = require('../seed/basic/02-bundles');

describe('GET /v1/repos/:repoId/versions/:versionNumber/bundles/:language', () => {

	beforeEach(async () => {
		await database.seed(app, 'basic');
	});

	const versions = {
		noBundles: {
			version: 'dbd71199-c1ab-4482-9988-eee350b3bdca',
			isBranded: true,
			hasBundles: false,
		},
		branded: {
			version: '9e4e450d-3b70-4672-b459-f297d434add6',
			isBranded: true,
			hasBundles: true,
		},
		notBranded: {
			version: 'b2bdfae1-cc6f-4433-9a2f-8a4b762cda71',
			isBranded: false,
			hasBundles: true,
		}
	};

	const tests = [
		Object.assign({}, versions.noBundles, {
			language: 'js',
			expectedBundles: [],
			expectedDescription: 'An empty array.',
		}),
		Object.assign({}, versions.branded, {
			language: 'js',
			expectedBundles: ['3aa9eb66-058b-44aa-8b09-764c9801ae31'],
			expectedDescription: 'All JS bundles.',
		}),
		Object.assign({}, versions.branded, {
			brand: 'none',
			language: 'js',
			expectedBundles: ['3aa9eb66-058b-44aa-8b09-764c9801ae31'],
			expectedDescription: 'All JS bundles',
		}),
		Object.assign({}, versions.branded, {
			brand: 'master',
			language: 'js',
			expectedBundles: [],
			expectedDescription: 'No JS bundles (no JS bundles are branded at time of writing).',
		}),
		Object.assign({}, versions.noBundles, {
			language: 'css',
			expectedBundles: [],
			expectedDescription: 'An empty array.',
		}),
		Object.assign({}, versions.branded, {
			language: 'css',
			expectedBundles: [
				'50a42415-df48-4643-bd9a-c05a57bcd544',
				'083f15a1-509b-44b2-88ab-7369c6e76326',
				'06d1fc27-e465-4e8f-8cb3-5a240f86ce55',
			],
			expectedDescription: 'All CSS bundles.',
		}),
		Object.assign({}, versions.branded, {
			brand: 'all',
			language: 'css',
			expectedBundles: [
				'50a42415-df48-4643-bd9a-c05a57bcd544',
				'083f15a1-509b-44b2-88ab-7369c6e76326',
				'06d1fc27-e465-4e8f-8cb3-5a240f86ce55',
			],
			expectedDescription: 'All CSS bundles.',
		}),
		Object.assign({}, versions.branded, {
			brand: 'master',
			language: 'css',
			expectedBundles: [
				'50a42415-df48-4643-bd9a-c05a57bcd544'
			],
			expectedDescription: 'Only the master brand CSS bundle.',
		}),
		Object.assign({}, versions.branded, {
			brand: 'master,internal',
			language: 'css',
			expectedBundles: [
				'50a42415-df48-4643-bd9a-c05a57bcd544',
				'083f15a1-509b-44b2-88ab-7369c6e76326',
			],
			expectedDescription: 'Only the CSS bundles for the explicitly requested brands.',
		}),
		Object.assign({}, versions.branded, {
			brand: 'none',
			language: 'css',
			expectedBundles: [],
			expectedDescription: 'No CSS bundles.',
		}),
		Object.assign({}, versions.branded, {
			brand: 'null',
			language: 'css',
			expectedBundles: [],
			expectedDescription: 'No CSS bundles.',
		}),
		Object.assign({}, versions.branded, {
			brand: 'undefined',
			language: 'css',
			expectedBundles: [],
			expectedDescription: 'No CSS bundles.',
		}),
		Object.assign({}, versions.notBranded, {
			language: 'css',
			expectedBundles: ['05824698-d1d6-49f6-9c45-9216a5b45533'],
			expectedDescription: 'Its only CSS bundle.',
		}),
		Object.assign({}, versions.notBranded, {
			brand: 'none',
			language: 'css',
			expectedBundles: ['05824698-d1d6-49f6-9c45-9216a5b45533'],
			expectedDescription: 'Its only CSS bundle.',
		}),
		Object.assign({}, versions.notBranded, {
			brand: 'all',
			language: 'css',
			expectedBundles: [],
			expectedDescription: 'No CSS bundle.',
		}),
		Object.assign({}, versions.notBranded, {
			brand: 'null',
			language: 'css',
			expectedBundles: ['05824698-d1d6-49f6-9c45-9216a5b45533'],
			expectedDescription: 'Its only CSS bundle.',
		}),
		Object.assign({}, versions.notBranded, {
			brand: 'undefined',
			language: 'css',
			expectedBundles: ['05824698-d1d6-49f6-9c45-9216a5b45533'],
			expectedDescription: 'Its only CSS bundle.',
		}),
		Object.assign({}, versions.notBranded, {
			brand: 'master',
			language: 'css',
			expectedBundles: [],
			expectedDescription: 'No CSS bundle.',
		}),
	];

	// Valid request tests.
	tests.forEach(data => {
		const {
			version,
			brand,
			language,
			expectedBundles,
			isBranded,
			hasBundles,
			expectedDescription
		} = data;

		describe(`A request for ${language.toUpperCase()} bundles of a ${isBranded ? 'branded' : 'non-branded'} version${!hasBundles ? ', which has no bundle stats yet' : ''}${brand ? `, with the brand parameter set to "${brand}"` : ''}.`, () => {
			const url = `/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/${version}/bundles/${language}${brand ? `?brand=${brand}` : ''}`;
			let request;

			before(async () => {
				await database.seed(app, 'basic');
				request = agent.get(url);
			});

			it('responds with a 200 status', () => {
				return request.expect(200);
			});

			it('responds with json', () => {
				return request.expect('Content-Type', /application\/json/);
			});

			it(`JSON response has expected bundles: ${expectedDescription}`, async () => {
				const response = (await request.then()).body;
				// Confirm the response is an array of an expected size.
				assert.isArray(response);
				assert.lengthEquals(response, expectedBundles.length);
				// Confirm that each item of the array is an expected bundle.
				expectedBundles.forEach(expectedId => {
					// Confirm a bundle with the correct id was given.
					const actual = response.find(b => b.id === expectedId);
					if (!actual) {
						assert.ok(false, `Could not find bundle "${expectedId}" in the response.`);
					}
					// Confirm the bundle has the expected properties.
					const expectedKeys = ['id','created','updated','versionId','brand','sizes','url'];
					assert.isObject(actual, 'Expected the bundle details to be an Object.');
					assert.deepEqual(Object.keys(actual).sort(), expectedKeys.sort(), 'Unexpected bundle properties where given in the response.');
					// Confirm all other bundle details against the seed data.
					const bundleData = seed.data.find(bundle => bundle.id === expectedId);
					if (!bundleData) {
						throw new Error(`Could not find actual ${expectedId} data to check the response.`);
					}
					assert.strictEqual(actual.id, bundleData['id']);
					assert.strictEqual(new Date(actual.created).toString(), bundleData['created_at'].toString());
					assert.strictEqual(new Date(actual.updated).toString(), bundleData['updated_at'].toString());
					assert.strictEqual(actual.versionId, bundleData['version_id']);
					assert.strictEqual(actual.brand, bundleData['brand']);
					assert.isObject(actual.sizes, 'Expected the bundle sizes to be an Object.');
					assert.lengthEquals(Object.keys(actual.sizes), 2, 'Expected to have two bundle sizes.');
					assert.strictEqual(actual.sizes.raw, bundleData['sizes']['raw']);
					assert.strictEqual(actual.sizes.gzip, bundleData['sizes']['gzip']);
					assert.strictEqual(actual.url, bundleData['url']);
				});
			});
		});

	});

	// Invalid request tests.
	describe('A request for an invalid brand "n$t-ok".', () => {
		let request;

		before(async () => {
			await database.seed(app, 'basic');
			request = agent.get('/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/9e4e450d-3b70-4672-b459-f297d434add6/bundles/css?brand=n$t-ok');
		});

		it('responds with a 400 status', () => {
			return request.expect(400);
		});
	});

});
