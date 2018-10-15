'use strict';

// Create versions for a mock service
exports.seed = async database => {

	const manifests = {
		package: {
			name: 'o-mock-component',
			dependencies: {
				'mock-npm-dependency-1': '^1.2.3',
				'mock-npm-dependency-2': '^4.5.6'
			},
			devDependencies: {
				'mock-npm-dependency-3': '^1.2.3',
				'mock-npm-dependency-4': '^4.5.6'
			},
			optionalDependencies: {
				'mock-npm-dependency-5': '^1.2.3'
			}
		},
		bower: {
			dependencies: {
				'mock-bower-dependency-1': '^1.2.3',
				'mock-bower-dependency-2': '^4.5.6'
			}
		}
	};

	await database('versions').insert([
		{
			id: '3731599a-f6a0-4856-8f28-9d10bc567d5b',
			repo_id: '855d47ce-697e-51b9-9882-0c3c9044f0f5',
			created_at: new Date('2017-02-01T06:08:08Z'),
			updated_at: new Date('2017-02-01T06:08:08Z'),
			name: 'mock-service',
			type: 'service',
			url: 'https://github.com/Financial-Times/mock-service',
			support_email: 'origami.support@ft.com',
			support_channel: '#ft-origami',
			tag: 'v1.0.0',
			version: '1.0.0',
			version_major: 1,
			version_minor: 0,
			version_patch: 0,
			version_prerelease: null,
			manifests: JSON.stringify(manifests),
			markdown: JSON.stringify({})
		},
		{
			id: '5dc3d45d-c56d-4a19-8e1c-dfaab936eeff',
			repo_id: '855d47ce-697e-51b9-9882-0c3c9044f0f5',
			created_at: new Date('2017-02-01T06:07:08Z'),
			updated_at: new Date('2017-02-01T06:07:08Z'),
			name: 'mock-service',
			type: 'service',
			url: 'https://github.com/Financial-Times/mock-service',
			support_email: 'origami.support@ft.com',
			support_channel: '#ft-origami',
			tag: '1.0.0',
			version: '1.0.0',
			version_major: 1,
			version_minor: 0,
			version_patch: 0,
			version_prerelease: null,
			manifests: JSON.stringify(manifests),
			markdown: JSON.stringify({})
		},
		{
			id: 'e9226d00-8716-42cb-babd-5a8b47d98859',
			repo_id: '855d47ce-697e-51b9-9882-0c3c9044f0f5',
			created_at: new Date('2017-02-02T05:04:03Z'),
			updated_at: new Date('2017-02-02T05:04:03Z'),
			name: 'mock-service',
			type: 'service',
			url: 'https://github.com/Financial-Times/mock-service',
			support_email: 'origami.support@ft.com',
			support_channel: '#ft-origami',
			tag: 'v2.0.0',
			version: '2.0.0',
			version_major: 2,
			version_minor: 0,
			version_patch: 0,
			version_prerelease: null,
			manifests: JSON.stringify(manifests),
			markdown: JSON.stringify({})
		},
		{
			id: '70baf25e-3c75-4ca6-b696-c6eae8d0cbcb',
			repo_id: '855d47ce-697e-51b9-9882-0c3c9044f0f5',
			created_at: new Date('2017-02-03T00:00:00Z'),
			updated_at: new Date('2017-02-03T00:00:00Z'),
			name: 'mock-service',
			type: 'service',
			url: 'https://github.com/Financial-Times/mock-service',
			support_email: 'origami.support@ft.com',
			support_channel: '#ft-origami',
			tag: 'v2.1.0',
			version: '2.1.0',
			version_major: 2,
			version_minor: 1,
			version_patch: 0,
			version_prerelease: null,
			manifests: JSON.stringify(manifests),
			markdown: JSON.stringify({})
		}
	]);

};
