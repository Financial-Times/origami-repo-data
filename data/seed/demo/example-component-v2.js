'use strict';

exports.seed = async database => {

    // UUIDs are static for the demo data so that we can share
    // local links with eachother and predictably test
    const ids = {
        version1: '94a94b8d-382e-410d-8445-3001da9ef3d9',
        version2: '3b341f7b-1428-4546-baa4-ceebd4cef0c4',
        version3: 'ab7ae584-8529-4764-b9a5-678e50328ce1',
    };

    // Use the same demos for each version
    const demos = [
        {
            name: 'example1',
            title: 'Example Demo 1',
            description: 'This is an example demo'
        },
        {
            name: 'example2',
            title: 'Example Demo 2',
            description: 'This is an example demo, it is only to demo the internal brand',
            brands: ['internal']
        }
    ];

    // Create a component repo which is maintained by Origami
    await database('versions').insert([
        {
            id: ids.version1,
            repo_id: '2683afa7-5997-5b0c-bfc9-abe0676dca55',
            created_at: new Date(Date.now() - 10000),
            updated_at: new Date(Date.now() - 10000),
            name: 'o-example-component-v2',
            type: 'component',
            url: 'https://github.com/Financial-Times/o-example-component-v2',
            support_email: 'origami.support@ft.com',
            support_channel: '#origami-support',
            tag: 'v1.0.0',
            version: '1.0.0',
            version_major: 1,
            version_minor: 0,
            version_patch: 0,
            version_prerelease: null,
            manifests: JSON.stringify({
                about: null,
                imageSet: null,
                origami: {
                    origami: '2.0',
                    type: 'component',
                    status: 'active',
                    brands: [
                        'master',
                        'internal'
                    ],
                    demos: demos
                },
                package: {
                    name: '@financial-times/o-example-component-v2',
                    description: 'An example Origami component, which follows v2 of the Origami specification',
                    keywords: 'example, mock',
                    version: '1.0.0',
                    type: 'module',
                    browser: './main.js',
                    license: 'MIT',
                    bugs: {
                        url: 'https://github.com/Financial-Times/o-example-component-v2/issues',
                        email: 'origami.support@ft.com',
                        slack: 'origami-support'
                    }
                }
            }),
            languages: JSON.stringify(['js']),
            markdown: JSON.stringify({
                designGuidelines: 'TODO add mock design guidelines',
                migrationGuide: null,
                readme: 'TODO add mock README'
            })
        },
        {
            id: ids.version2,
            repo_id: '2683afa7-5997-5b0c-bfc9-abe0676dca55',
            created_at: new Date(Date.now() - 5000),
            updated_at: new Date(Date.now() - 5000),
            name: 'o-example-component-v2',
            type: 'component',
            url: 'https://github.com/Financial-Times/o-example-component-v2',
            support_email: 'origami.support@ft.com',
            support_channel: '#origami-support',
            tag: 'v1.1.0',
            version: '1.1.0',
            version_major: 1,
            version_minor: 1,
            version_patch: 0,
            version_prerelease: null,
            manifests: JSON.stringify({
                about: null,
                imageSet: null,
                origami: {
                    origami: '2.0',
                    type: 'component',
                    status: 'active',
                    demos: demos
                },
                package: {
                    name: '@financial-times/o-example-component-v2',
                    description: 'An example Origami component, which follows v2 of the Origami specification',
                    keywords: 'example, mock',
                    version: '1.1.0',
                    type: 'module',
                    browser: './main.js',
                    license: 'MIT',
                    bugs: {
                        url: 'https://github.com/Financial-Times/o-example-component-v2/issues',
                        email: 'origami.support@ft.com',
                        slack: 'origami-support'
                    }
                }
            }),
            languages: JSON.stringify(['js']),
            markdown: JSON.stringify({
                designGuidelines: 'TODO add mock design guidelines',
                migrationGuide: null,
                readme: 'TODO add mock README'
            })
        },
        {
            id: ids.version3,
            repo_id: '2683afa7-5997-5b0c-bfc9-abe0676dca55',
            created_at: new Date(Date.now()),
            updated_at: new Date(Date.now()),
            name: 'o-example-component-v2',
            type: 'component',
            url: 'https://github.com/Financial-Times/o-example-component-v2',
            support_email: 'origami.support@ft.com',
            support_channel: '#origami-support',
            tag: 'v2.0.0',
            version: '2.0.0',
            version_major: 2,
            version_minor: 0,
            version_patch: 0,
            version_prerelease: null,
            manifests: JSON.stringify({
                about: null,
                imageSet: null,
                origami: {
                    origami: '2.0',
                    type: 'component',
                    status: 'active',
                    demos: demos
                },
                package: {
                    name: '@financial-times/o-example-component-v2',
                    description: 'An example Origami component, which follows v2 of the Origami specification',
                    keywords: 'example, mock',
                    version: '2.0.0',
                    type: 'module',
                    browser: './main.js',
                    sass: './main.scss',
                    license: 'MIT',
                    bugs: {
                        url: 'https://github.com/Financial-Times/o-example-component-v2/issues',
                        email: 'origami.support@ft.com',
                        slack: 'origami-support'
                    },
                    peerDependencies: {
                        'mathsass': '^0.11.0'
                    }
                },
            }),
            languages: JSON.stringify(['js', 'scss']),
            markdown: JSON.stringify({
                designGuidelines: 'TODO add mock design guidelines',
                migrationGuide: null,
                readme: 'TODO add mock README'
            })
        }
    ]);

};
