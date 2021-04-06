'use strict';

exports.seed = async database => {

	// UUIDs are static for the demo data so that we can share
	// local links with eachother and predictably test
	const ids = {
		version1: '5bdc1cb5-19f1-4afe-883b-83c822fbbde0',
		version2: 'b2bdfae1-cc6f-4433-9a2f-8a4b762cda71',
		version3: '9e4e450d-3b70-4672-b459-f297d434add6',
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
			description: 'This is an example demo'
		}
	];

	// Create a component repo which is maintained by Origami
	await database('versions').insert([
		{
			id: ids.version1,
			repo_id: '2683afa7-5997-5b0c-bfc9-abe0676dca55',
			created_at: new Date(Date.now() - 10000),
			updated_at: new Date(Date.now() - 10000),
			name: 'o-example-component',
			type: 'module',
			url: 'https://github.com/Financial-Times/o-example-component',
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
				bower: {
					name: 'o-example-component',
					dependencies: {},
					main: './main.js'
				},
				imageSet: null,
				origami: {
					description: 'An example Origami component',
					origamiType: 'module',
					origamiCategory: 'components',
					brands: [
						'master',
						'internal'
					],
					origamiVersion: 1,
					support: 'https://github.com/Financial-Times/o-example-component/issues',
					supportStatus: 'active',
					demos: demos
				},
				package: {
					keywords: ['example', 'mock']
				}
			}),
			languages: ['js'],
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
			name: 'o-example-component',
			type: 'module',
			url: 'https://github.com/Financial-Times/o-example-component',
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
				bower: {
					name: 'o-example-component',
					dependencies: {},
					main: ['./main.js', './main.scss']
				},
				imageSet: null,
				origami: {
					description: 'An example Origami component',
					origamiType: 'module',
					origamiCategory: 'components',
					origamiVersion: 1,
					support: 'https://github.com/Financial-Times/o-example-component/issues',
					supportStatus: 'active',
					demos: demos
				},
				package: {
					keywords: ['example', 'mock']
				}
			}),
			languages: ['js', 'scss'],
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
			name: 'o-example-component',
			type: 'module',
			url: 'https://github.com/Financial-Times/o-example-component',
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
				bower: {
					name: 'o-example-component',
					dependencies: {},
					main: ['./main.js', './main.scss']
				},
				imageSet: null,
				origami: {
					description: 'An example Origami component',
					origamiType: 'module',
					origamiCategory: 'components',
					origamiVersion: 1,
					support: 'https://github.com/Financial-Times/o-example-component/issues',
					supportStatus: 'active',
					demos: demos
				},
				package: {
					keywords: ['example', 'mock']
				}
			}),
			languages: ['js', 'scss'],
			markdown: JSON.stringify({
				designGuidelines: 'TODO add mock design guidelines',
				migrationGuide: null,
				readme: 'TODO add mock README'
			})
		}
	]);

};
