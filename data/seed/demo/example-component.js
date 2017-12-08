'use strict';

exports.seed = async database => {

	// UUIDs are static for the demo data so that we can share
	// local links with eachother and predictably test
	const ids = {
		version1: '5bdc1cb5-19f1-4afe-883b-83c822fbbde0',
		version2: 'b2bdfae1-cc6f-4433-9a2f-8a4b762cda71',
		version3: '9e4e450d-3b70-4672-b459-f297d434add6',
	};

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
			support_channel: '#ft-origami',
			tag: 'v1.0.0',
			version: '1.0.0',
			manifests: JSON.stringify({
				about: null,
				bower: {
					name: 'o-example-component',
					dependencies: {}
				},
				imageSet: null,
				origami: {
					description: 'An example Origami component',
					origamiType: 'module',
					origamiCategory: 'components',
					keywords: 'example, mock',
					origamiVersion: 1,
					support: 'https://github.com/Financial-Times/o-example-component/issues',
					supportStatus: 'active'
				},
				package: null
			}),
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
			support_channel: '#ft-origami',
			tag: 'v1.1.0',
			version: '1.1.0',
			manifests: JSON.stringify({
				about: null,
				bower: {
					name: 'o-example-component',
					dependencies: {}
				},
				imageSet: null,
				origami: {
					description: 'An example Origami component',
					origamiType: 'module',
					origamiCategory: 'components',
					keywords: 'example, mock',
					origamiVersion: 1,
					support: 'https://github.com/Financial-Times/o-example-component/issues',
					supportStatus: 'active'
				},
				package: null
			}),
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
			support_channel: '#ft-origami',
			tag: 'v2.0.0',
			version: '2.0.0',
			manifests: JSON.stringify({
				about: null,
				bower: {
					name: 'o-example-component',
					dependencies: {}
				},
				imageSet: null,
				origami: {
					description: 'An example Origami component',
					origamiType: 'module',
					origamiCategory: 'components',
					keywords: 'example, mock',
					origamiVersion: 1,
					support: 'https://github.com/Financial-Times/o-example-component/issues',
					supportStatus: 'active'
				},
				package: null
			}),
			markdown: JSON.stringify({
				designGuidelines: 'TODO add mock design guidelines',
				migrationGuide: null,
				readme: 'TODO add mock README'
			})
		}
	]);

};
