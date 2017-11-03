'use strict';

// Create versions for a mock service
exports.seed = async database => {
	await database('versions').insert([
		{
			id: '3731599a-f6a0-4856-8f28-9d10bc567d5b',
			repo_id: '855d47ce-697e-51b9-9882-0c3c9044f0f5',
			created_at: new Date('2017-02-01T06:07:08Z'),
			updated_at: new Date('2017-02-01T06:07:08Z'),
			name: 'mock-service',
			type: 'service',
			url: 'https://github.com/Financial-Times/mock-service',
			support_email: 'origami.support@ft.com',
			support_channel: '#ft-origami',
			version: 'v1.0.0',
			commit_hash: 'mock-hash-1',
			manifests: JSON.stringify({}),
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
			version: 'v2.0.0',
			commit_hash: 'mock-hash-2',
			manifests: JSON.stringify({}),
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
			version: 'v2.1.0',
			commit_hash: 'mock-hash-3',
			manifests: JSON.stringify({}),
			markdown: JSON.stringify({})
		}
	]);
};
