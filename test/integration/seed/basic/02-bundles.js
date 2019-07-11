'use strict';

const data = [
    // v1.1.0 (not branded): js
    {
        id: '5a9833fe-cc93-4b93-85fb-c50325a287ea',
        created_at: new Date('2017-01-01T00:00:00Z'),
        updated_at: new Date('2017-01-03T00:00:00Z'),
        version_id: 'b2bdfae1-cc6f-4433-9a2f-8a4b762cda71',
        language: 'js',
        brand: null,
        sizes: {
            'raw': 700,
            'gzip': 150,
        },
        url: 'https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-mock-component%402.0.0',
    },
    // v1.1.0 (not branded): css
    {
        id: '05824698-d1d6-49f6-9c45-9216a5b45533',
        created_at: new Date('2017-01-01T00:00:00Z'),
        updated_at: new Date('2017-01-03T00:00:00Z'),
        version_id: 'b2bdfae1-cc6f-4433-9a2f-8a4b762cda71',
        language: 'css',
        brand: null,
        sizes: {
            'raw': 17500,
            'gzip': 1095,
        },
        url: 'https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-mock-component%402.0.0',
    },
    // v2.0.0 (branded): js no brands
    {
        id: '3aa9eb66-058b-44aa-8b09-764c9801ae31',
        created_at: new Date('2017-01-02T00:00:00Z'),
        updated_at: new Date('2017-01-02T00:00:00Z'),
        version_id: '9e4e450d-3b70-4672-b459-f297d434add6',
        language: 'js',
        brand: null,
        sizes: {
            'raw': 600,
            'gzip': 200,
        },
        url: 'https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-mock-component%402.0.0',
    },
    // v2.0.0 (branded): css master brand
    {
        id: '50a42415-df48-4643-bd9a-c05a57bcd544',
        created_at: new Date('2017-01-02T00:00:00Z'),
        updated_at: new Date('2017-01-02T00:00:00Z'),
        version_id: '9e4e450d-3b70-4672-b459-f297d434add6',
        language: 'css',
        brand: 'master',
        sizes: {
            'raw': 18000,
            'gzip': 1200,
        },
        url: 'https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-mock-component%402.0.0&brand=master',
    },
    // v2.0.0 (branded): css internal brand
    {
        id: '083f15a1-509b-44b2-88ab-7369c6e76326',
        created_at: new Date('2017-01-02T00:00:00Z'),
        updated_at: new Date('2017-01-02T00:00:00Z'),
        version_id: '9e4e450d-3b70-4672-b459-f297d434add6',
        language: 'css',
        brand: 'internal',
        sizes: {
            'raw': 16000,
            'gzip': 1100,
        },
        url: 'https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-mock-component%402.0.0&brand=internal',
    },
    // v2.0.0 (branded): css whitelabel brand
    {
        id: '06d1fc27-e465-4e8f-8cb3-5a240f86ce55',
        created_at: new Date('2017-01-02T00:00:00Z'),
        updated_at: new Date('2017-01-02T00:00:00Z'),
        version_id: '9e4e450d-3b70-4672-b459-f297d434add6',
        language: 'css',
        brand: 'whitelabel',
        sizes: {
            'raw': 9000,
            'gzip': 400,
        },
        url: 'https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-mock-component%402.0.0&brand=whitelabel',
    }
];

exports.data = data;

exports.seed = async database => {
    await database('bundles').insert(data);
};
