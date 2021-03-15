'use strict';

exports.seed = async database => {

	// UUIDs are static for the demo data so that we can share
	// local links with eachother and predictably test
	const ids = {
		version1: '0BF9C54C-7E83-4049-9C6A-72C9A8134966',
		version2: 'A0BD8634-EC99-4078-B4DD-F1A42AADBB2C',
		version3: '573A990F-4412-4BEF-AB1B-4768461557D5',
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
			repo_id: '423c7b28-b294-56f9-a7ea-c6ad675e0c04',
			created_at: new Date(Date.now() - 20000),
			updated_at: new Date(Date.now() - 20000),
			name: 'o-example-component-non-origami',
			type: 'module',
			url: 'https://github.com/Financial-Times/o-example-component-non-origami',
			support_email: 'next.developers@ft.com',
			support_channel: '#ft-next-dev',
			tag: 'v1.0.0',
			version: '1.0.0',
			version_major: 1,
			version_minor: 0,
			version_patch: 0,
			version_prerelease: null,
			manifests: JSON.stringify({
				about: null,
				bower: {
					name: 'o-example-component-non-origami',
					dependencies: {}
				},
				imageSet: null,
				origami: {
					description: 'An example Origami component not supported by the team',
					origamiType: 'module',
					origamiCategory: 'components',
					brands: [
						'master',
						'internal'
					],
					keywords: 'example, mock',
					origamiVersion: 1,
					support: 'https://github.com/Financial-Times/o-example-component-non-origami/issues',
					supportStatus: 'active',
					demos: demos
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
			repo_id: '423c7b28-b294-56f9-a7ea-c6ad675e0c04',
			created_at: new Date(Date.now() - 7500),
			updated_at: new Date(Date.now() - 7500),
			name: 'o-example-component-non-origami',
			type: 'module',
			url: 'https://github.com/Financial-Times/o-example-component-non-origami',
			support_email: 'next.developers@ft.com',
			support_channel: '#ft-next-dev',
			tag: 'v1.0.1',
			version: '1.0.1',
			version_major: 1,
			version_minor: 0,
			version_patch: 1,
			version_prerelease: null,
			manifests: JSON.stringify({
				about: null,
				bower: {
					name: 'o-example-component-non-origami',
					dependencies: {}
				},
				imageSet: null,
				origami: {
					description: 'An example Origami component not supported by the team',
					origamiType: 'module',
					origamiCategory: 'components',
					keywords: 'example, mock',
					origamiVersion: 1,
					support: 'https://github.com/Financial-Times/o-example-component-non-origami/issues',
					supportStatus: 'active',
					demos: demos
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
			repo_id: '423c7b28-b294-56f9-a7ea-c6ad675e0c04',
			created_at: new Date(Date.now() - 500),
			updated_at: new Date(Date.now() - 500),
			name: 'o-example-component-non-origami',
			type: 'module',
			url: 'https://github.com/Financial-Times/o-example-component-non-origami',
			support_email: 'next.developers@ft.com',
			support_channel: '#ft-next-dev',
			tag: 'v2.0.0',
			version: '2.0.0',
			version_major: 2,
			version_minor: 0,
			version_patch: 0,
			version_prerelease: null,
			manifests: JSON.stringify({
				about: null,
				bower: {
					name: 'o-example-component-non-origami',
					dependencies: {}
				},
				imageSet: null,
				origami: {
					description: 'An example Origami component not supported by the team',
					origamiType: 'module',
					origamiCategory: 'components',
					keywords: 'example, mock',
					origamiVersion: 1,
					support: 'https://github.com/Financial-Times/o-example-component-non-origami/issues',
					supportStatus: 'active',
					demos: demos
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
