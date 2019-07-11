/* global agent, app */
'use strict';

const assert = require('proclaim');
const database = require('../helpers/database');
const seed = require('../seed/basic/02-bundles');

function assertBundle(expectedId, response) {
    // Confirm the actual response has an object.
    const actual = response.find(b => b.id === expectedId);
    if(!actual) {
        assert.ok(false, `Could not find bundle "${expectedId}" in the response.`);
    }
    assert.isObject(actual, 'Expected the bundle details to be an Object.');
    assert.lengthEquals(Object.keys(actual), 7, 'Expected the return bundle details to have 8 keys.');
    // Get the actual data for the bundle we expect.
    const bundleData = seed.data.find(bundle => bundle.id === expectedId);
    if (!bundleData) {
        throw new Error(`Could not find actual ${expectedId} data to check the response.`);
    }
    // Assert the bundle we expected is represented in the response.
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
}


describe('GET /v1/repos/:repoId/versions/:versionNumber/bundles/:language', () => {

    beforeEach(async () => {
        await database.seed(app, 'basic');
    });

    const tests = [
        {
            version: '9e4e450d-3b70-4672-b459-f297d434add6',
            versionIsBranded: true,
            brands: [],
            language: 'js',
            expectedBundles: ['3aa9eb66-058b-44aa-8b09-764c9801ae31'],
            expectedDescription: 'All JS bundles.',
        },
        {
            version: '9e4e450d-3b70-4672-b459-f297d434add6',
            versionIsBranded: true,
            brands: ['none'],
            language: 'js',
            expectedBundles: ['3aa9eb66-058b-44aa-8b09-764c9801ae31'],
            expectedDescription: 'All JS bundles',
        },
        {
            version: '9e4e450d-3b70-4672-b459-f297d434add6',
            versionIsBranded: true,
            brands: ['master'],
            language: 'js',
            expectedBundles: [],
            expectedDescription: 'No JS bundles (no JS bundles are branded at time of writing).',
        },
        {
            version: '9e4e450d-3b70-4672-b459-f297d434add6',
            versionIsBranded: true,
            brands: [],
            language: 'css',
            expectedBundles: [
                '50a42415-df48-4643-bd9a-c05a57bcd544',
                '083f15a1-509b-44b2-88ab-7369c6e76326',
                '06d1fc27-e465-4e8f-8cb3-5a240f86ce55',
            ],
            expectedDescription: 'All CSS bundles.',
        },
        {
            version: '9e4e450d-3b70-4672-b459-f297d434add6',
            versionIsBranded: true,
            brands: ['all'],
            language: 'css',
            expectedBundles: [
                '50a42415-df48-4643-bd9a-c05a57bcd544',
                '083f15a1-509b-44b2-88ab-7369c6e76326',
                '06d1fc27-e465-4e8f-8cb3-5a240f86ce55',
            ],
            expectedDescription: 'All CSS bundles.',
        },
        {
            version: '9e4e450d-3b70-4672-b459-f297d434add6',
            versionIsBranded: true,
            brands: ['master'],
            language: 'css',
            expectedBundles: [
                '50a42415-df48-4643-bd9a-c05a57bcd544'
            ],
            expectedDescription: 'Only the master brand CSS bundle.',
        },
        {
            version: '9e4e450d-3b70-4672-b459-f297d434add6',
            versionIsBranded: true,
            brands: ['master', 'internal'],
            language: 'css',
            expectedBundles: [
                '50a42415-df48-4643-bd9a-c05a57bcd544',
                '083f15a1-509b-44b2-88ab-7369c6e76326',
            ],
            expectedDescription: 'Only the CSS bundles for the explicitly requested brands.',
        },
        {
            version: '9e4e450d-3b70-4672-b459-f297d434add6',
            versionIsBranded: true,
            brands: ['none'],
            language: 'css',
            expectedBundles: [],
            expectedDescription: 'No CSS bundles.',
        },
        {
            version: '9e4e450d-3b70-4672-b459-f297d434add6',
            versionIsBranded: true,
            brands: ['null'],
            language: 'css',
            expectedBundles: [],
            expectedDescription: 'No CSS bundles.',
        },
        {
            version: '9e4e450d-3b70-4672-b459-f297d434add6',
            versionIsBranded: true,
            brands: ['undefined'],
            language: 'css',
            expectedBundles: [],
            expectedDescription: 'No CSS bundles.',
        },
        {
            version: 'b2bdfae1-cc6f-4433-9a2f-8a4b762cda71',
            versionIsBranded: false,
            brands: [],
            language: 'css',
            expectedBundles: ['05824698-d1d6-49f6-9c45-9216a5b45533'],
            expectedDescription: 'Its CSS bundle.',
        },
        {
            version: 'b2bdfae1-cc6f-4433-9a2f-8a4b762cda71',
            versionIsBranded: false,
            brands: ['none'],
            language: 'css',
            expectedBundles: ['05824698-d1d6-49f6-9c45-9216a5b45533'],
            expectedDescription: 'Its CSS bundle.',
        },
        {
            version: 'b2bdfae1-cc6f-4433-9a2f-8a4b762cda71',
            versionIsBranded: false,
            brands: ['all'],
            language: 'css',
            expectedBundles: [],
            expectedDescription: 'No CSS bundle.',
        },
        {
            version: 'b2bdfae1-cc6f-4433-9a2f-8a4b762cda71',
            versionIsBranded: false,
            brands: ['null'],
            language: 'css',
            expectedBundles: ['05824698-d1d6-49f6-9c45-9216a5b45533'],
            expectedDescription: 'Its CSS bundle.',
        },
        {
            version: 'b2bdfae1-cc6f-4433-9a2f-8a4b762cda71',
            versionIsBranded: false,
            brands: ['undefined'],
            language: 'css',
            expectedBundles: ['05824698-d1d6-49f6-9c45-9216a5b45533'],
            expectedDescription: 'Its CSS bundle.',
        },
        {
            version: 'b2bdfae1-cc6f-4433-9a2f-8a4b762cda71',
            versionIsBranded: false,
            brands: ['master'],
            language: 'css',
            expectedBundles: [],
            expectedDescription: 'No CSS bundle.',
        },
    ];

    tests.forEach(data => {
        const { version, brands, language, expectedBundles, versionIsBranded, expectedDescription} = data;
        const url = `/v1/repos/c990cb4b-c82b-5071-afb0-16149debc53d/versions/${version}/bundles/${language}${brands.length > 0 ? `?brand=${brands.join(',')}` : ''}`;

        describe(`A request for ${language.toUpperCase()} bundles of a ${versionIsBranded ? 'branded' : 'non-branded'} version${brands.length > 0 ? `, with the brand parameter set to "${brands}"` : ''}.`, () => {
            let request;

            before(async () => {
                await database.seed(app, 'basic');
                request = agent
                    .get(url)
                    .set('X-Api-Key', 'mock-read-key')
                    .set('X-Api-Secret', 'mock-read-secret');
            });

            it('responds with a 200 status', () => {
                return request.expect(200);
            });

            it('responds with json', () => {
                return request.expect('Content-Type', /application\/json/);
            });

            it(`JSON response has expected bundles: ${expectedDescription}`, async () => {
                const response = (await request.then()).body;
                assert.isArray(response);
                assert.lengthEquals(response, expectedBundles.length);
                expectedBundles.forEach(expectedId => {
                    assertBundle(expectedId, response);
                });
            });
        });

    });

});
