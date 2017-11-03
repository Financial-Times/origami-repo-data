'use strict';

exports.seed = async database => {

	// UUIDs are static for the demo data so that we can share
	// local links with eachother and predictably test
	const ids = {
		version1: 'b0dfa5e0-aab2-410d-b4be-14997fab0a31',
		version2: '84186753-257f-4d75-b1ba-0a657772ee31'
	};

	// Create a node module repo which is maintained by Origami
	await database('versions').insert([
		{
			id: ids.version1,
			repo_id: '98f4c2aa-a99c-51b0-8a12-f9af235e386f',
			created_at: new Date(Date.now() - 6000),
			name: 'node-example-module',
			type: null,
			url: 'https://github.com/Financial-Times/node-example-module',
			support_email: 'origami.support@ft.com',
			support_channel: '#ft-origami',
			version: 'v1.0.0',
			commit_hash: '071a20f7e49b6fcf29c1080140d599c8c60b71b6',
			manifests: JSON.stringify({
				about: null,
				bower: null,
				imageSet: null,
				origami: null,
				package: {
					name: '@financial-times/example-module',
					description: 'An example Node.js module',
					keywords: ['node', 'example'],
					dependencies: {}
				}
			}),
			markdown: JSON.stringify({
				designGuidelines: null,
				migrationGuide: null,
				readme: 'TODO add mock README'
			})
		},
		{
			id: ids.version2,
			repo_id: '98f4c2aa-a99c-51b0-8a12-f9af235e386f',
			created_at: new Date(Date.now() - 1000),
			updated_at: new Date(Date.now() - 1000),
			name: 'node-example-module',
			type: 'module',
			url: 'https://github.com/Financial-Times/node-example-module',
			support_email: 'origami.support@ft.com',
			support_channel: '#ft-origami',
			version: 'v1.1.0',
			commit_hash: '64a7ab36ee875404a57f62c2fe0bea528603f022',
			manifests: JSON.stringify({
				about: null,
				bower: null,
				imageSet: null,
				origami: null,
				package: {
					name: '@financial-times/example-module',
					description: 'An example Node.js module',
					keywords: ['node', 'example'],
					dependencies: {}
				}
			}),
			markdown: JSON.stringify({
				designGuidelines: null,
				migrationGuide: null,
				readme: 'TODO add mock README'
			})
		}
	]);

};