'use strict';

// Create versions for a mock component
exports.seed = async database => {

	const manifests = {
		origami: {
			name: 'o-mock-imageset',
			origamiType: 'imageset',
			isMockManifest: true
		},
		imageSet: {
			scheme: 'ftmock',
			images: [
				{
					name: 'example-image-1'
				},
				{
					name: 'example-image-2'
				}
			]
		}
	};

	const markdown = {
		readme: 'mock-readme'
	};

	await database('versions').insert([
		{
			id: 'ecd0f3c7-dac8-4354-95e0-cb9c0cd686ea',
			repo_id: '833bf423-4952-53e7-8fc0-e9e8554caf77',
			created_at: new Date('2017-01-01T06:07:08Z'),
			updated_at: new Date('2017-01-01T06:07:08Z'),
			name: 'o-mock-imageset',
			type: 'imageset',
			url: 'https://github.com/Financial-Times/o-mock-imageset',
			support_email: 'origami.support@ft.com',
			support_channel: '#origami-support',
			tag: 'v1.0.0',
			version: '1.0.0',
			version_major: 1,
			version_minor: 0,
			version_patch: 0,
			version_prerelease: null,
			manifests: JSON.stringify(manifests),
			markdown: JSON.stringify(markdown)
		}
	]);
};
