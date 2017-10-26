'use strict';

exports.seed = async (database, Promise) => {

	// UUIDs are static for the demo data so that we can share
	// local links with eachother and predictably test
	const ids = {
		repo: '56592496-445e-4e3c-ad54-e8e3b10b9d34',
		version1: '5bdc1cb5-19f1-4afe-883b-83c822fbbde0',
		version2: 'b2bdfae1-cc6f-4433-9a2f-8a4b762cda71',
		version3: '9e4e450d-3b70-4672-b459-f297d434add6',
	};

	// Create a component repo which is maintained by Origami
	await database('repos').insert({
		id: ids.repo,
		name: 'o-example-component',
		type: 'module',
		url: 'https://github.com/Financial-Times/o-example-component',
		supportEmail: 'origami.support@ft.com',
		supportChannel: '#ft-origami'
	});
	await database('versions').insert([
		{
			id: ids.version1,
			repo: ids.repo,
			number: 'v1.0.0',
			commitHash: 'bca9e0e599880484ba2c0245096e58b3977f34fc',
			origamiManifest: JSON.stringify({
				description: 'An example Origami component',
				origamiType: 'module',
				origamiCategory: 'components',
				keywords: 'example, mock',
				origamiVersion: 1,
				support: 'https://github.com/Financial-Times/o-example-component/issues',
				supportStatus: 'active'
			}),
			bowerManifest: JSON.stringify({
				name: 'o-example-component',
				dependencies: {}
			}),
			imagesetManifest: null,
			aboutManifest: null,
			packageManifest: null,
			markdownDocuments: JSON.stringify({
				designGuidelines: 'TODO add mock design guidelines',
				migrationGuide: null,
				readme: 'TODO add mock README'
			})
		},
		{
			id: ids.version2,
			repo: ids.repo,
			number: 'v1.1.0',
			commitHash: '2bd8b4de9e0c213aff6769aba6d8d5d820b5d434',
			origamiManifest: JSON.stringify({
				description: 'An example Origami component',
				origamiType: 'module',
				origamiCategory: 'components',
				keywords: 'example, mock',
				origamiVersion: 1,
				support: 'https://github.com/Financial-Times/o-example-component/issues',
				supportStatus: 'active'
			}),
			bowerManifest: JSON.stringify({
				name: 'o-example-component',
				dependencies: {}
			}),
			imagesetManifest: null,
			aboutManifest: null,
			packageManifest: null,
			markdownDocuments: JSON.stringify({
				designGuidelines: 'TODO add mock design guidelines',
				migrationGuide: null,
				readme: 'TODO add mock README'
			})
		},
		{
			id: ids.version3,
			repo: ids.repo,
			number: 'v2.0.0',
			commitHash: 'd440c97c5664c56058f57e9d27d9b81944e1f226',
			origamiManifest: JSON.stringify({
				description: 'An example Origami component',
				origamiType: 'module',
				origamiCategory: 'components',
				keywords: 'example, mock',
				origamiVersion: 1,
				support: 'https://github.com/Financial-Times/o-example-component/issues',
				supportStatus: 'active'
			}),
			bowerManifest: JSON.stringify({
				name: 'o-example-component',
				dependencies: {
					'o-example-dependency': '^1.2.3'
				}
			}),
			imagesetManifest: null,
			aboutManifest: null,
			packageManifest: null,
			markdownDocuments: JSON.stringify({
				designGuidelines: 'TODO add mock design guidelines',
				migrationGuide: 'TODO add mock migration guide',
				readme: 'TODO add mock README'
			})
		}
	]);

};
