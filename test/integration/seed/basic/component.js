'use strict';

// Create versions for a mock component
exports.seed = async database => {

	const manifests = {
		origami: {
			name: 'o-mock-component',
			origamiType: 'module',
			brands: [
				'master',
				'internal'
			],
			keywords: '',
			isMockManifest: true,
			demos: [
				{
					name: 'example1',
					title: 'Example Demo 1',
					description: 'This is an example demo'
				},
				{
					name: 'example2',
					title: 'Example Demo 2',
					description: ''
				},
				{
					invalid: true
				},
				'invalid',
				{
					name: 'example-hidden',
					title: 'Example Hidden Demo',
					description: 'This is an example hidden demo',
					hidden: true
				},
				{
					name: 'example-no-html',
					title: 'Example No-HTML Demo',
					description: 'This is an example demo without HTML to be displayed',
					display_html: false
				},
				{
					name: 'example-branded-demo',
					title: 'Example Branded Demo',
					description: 'This is an example demo for the "example-brand" brand',
					brands: ['example-brand']
				}
			]
		},
		bower: {
			main: [
				'example.mock1',
				'example2.mock1',
				'example3.MOCK2'
			],
			dependencies: {
				'mock-bower-dependency-1': '^1.2.3',
				'mock-bower-dependency-2': '^4.5.6'
			},
			devDependencies: {
				'mock-bower-dependency-3': '^1.2.3',
				'mock-bower-dependency-4': '^4.5.6'
			}
		}
	};

	const markdown = {
		readme: 'mock-readme'
	};

	await database('versions').insert([
		{
			id: '5bdc1cb5-19f1-4afe-883b-83c822fbbde0',
			repo_id: 'c990cb4b-c82b-5071-afb0-16149debc53d',
			created_at: new Date('2017-01-01T06:07:08Z'),
			updated_at: new Date('2017-01-01T06:07:08Z'),
			name: 'o-mock-component',
			type: 'module',
			url: 'https://github.com/Financial-Times/o-mock-component',
			support_email: 'origami.support@ft.com',
			support_channel: '#ft-origami',
			tag: 'v1.0.0',
			version: '1.0.0',
			version_major: 1,
			version_minor: 0,
			version_patch: 0,
			version_prerelease: null,
			manifests: JSON.stringify(manifests),
			markdown: JSON.stringify(markdown)
		},
		{
			id: 'b2bdfae1-cc6f-4433-9a2f-8a4b762cda71',
			repo_id: 'c990cb4b-c82b-5071-afb0-16149debc53d',
			created_at: new Date('2017-01-02T05:04:03Z'),
			updated_at: new Date('2017-01-02T05:04:03Z'),
			name: 'o-mock-component',
			type: 'module',
			url: 'https://github.com/Financial-Times/o-mock-component',
			support_email: 'origami.support@ft.com',
			support_channel: '#ft-origami',
			tag: 'v1.1.0',
			version: '1.1.0',
			version_major: 1,
			version_minor: 1,
			version_patch: 0,
			version_prerelease: null,
			manifests: JSON.stringify(manifests),
			markdown: JSON.stringify(markdown)
		},
		{
			id: '9e4e450d-3b70-4672-b459-f297d434add6',
			repo_id: 'c990cb4b-c82b-5071-afb0-16149debc53d',
			created_at: new Date('2017-01-03T00:00:00Z'),
			updated_at: new Date('2017-01-03T00:00:00Z'),
			name: 'o-mock-component',
			type: 'module',
			url: 'https://github.com/Financial-Times/o-mock-component',
			support_email: 'origami.support@ft.com',
			support_channel: '#ft-origami',
			tag: 'v2.0.0',
			version: '2.0.0',
			version_major: 2,
			version_minor: 0,
			version_patch: 0,
			version_prerelease: null,
			manifests: JSON.stringify(manifests),
			markdown: JSON.stringify(markdown)
		},
		{
			id: 'dbd71199-c1ab-4482-9988-eee350b3bdca',
			repo_id: 'c990cb4b-c82b-5071-afb0-16149debc53d',
			created_at: new Date('2017-01-04T00:00:00Z'),
			updated_at: new Date('2017-01-04T00:00:00Z'),
			name: 'o-mock-component',
			type: 'module',
			url: 'https://github.com/Financial-Times/o-mock-component',
			support_email: 'origami.support@ft.com',
			support_channel: '#ft-origami',
			tag: 'v3.0.0-beta.1',
			version: '3.0.0-beta.1',
			version_major: 3,
			version_minor: 0,
			version_patch: 0,
			version_prerelease: 'beta.1',
			manifests: JSON.stringify(manifests),
			markdown: JSON.stringify(markdown)
		}
	]);
};
