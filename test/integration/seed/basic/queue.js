'use strict';

// Create keys with different access levels
exports.seed = async database => {
	await database('ingestion_queue').insert([

		// Regular ingestions
		{
			id: '5a070ea9-44f8-4312-8080-c4882d642ec4',
			created_at: new Date('2017-01-02T00:00:00Z'),
			updated_at: new Date('2017-01-02T00:00:00Z'),
			url: 'https://github.com/Financial-Times/o-mock-component',
			tag: 'v2.1.0'
		},
		{
			id: '988451cb-6d71-4a68-b435-3d5cf30b9614',
			created_at: new Date('2017-01-02T01:00:00Z'),
			updated_at: new Date('2017-01-02T01:00:00Z'),
			url: 'https://github.com/Financial-Times/mock-service',
			tag: 'v3.0.0'
		},

		// Ingestions with lots of attempts
		{
			id: '49460ab4-11a0-4bb1-be4e-be85f4217b8d',
			created_at: new Date('2017-01-02T02:00:00Z'),
			updated_at: new Date('2017-01-02T02:00:00Z'),
			url: 'https://github.com/Financial-Times/mock-multiple-attempts',
			tag: 'v1.0.0',
			ingestion_attempts: 5
		},
		{
			id: '0ba4dafe-2ac7-43f0-bcb8-29b288728bad',
			created_at: new Date('2017-01-02T02:00:00Z'),
			updated_at: new Date('2017-01-02T02:00:00Z'),
			url: 'https://github.com/Financial-Times/mock-multiple-attempts',
			tag: 'v1.1.0',
			ingestion_attempts: 10
		},

		// Ingestions with long run times
		{
			id: '506427b7-9dfa-4424-ba3a-bb325f5b7d7c',
			created_at: new Date('2017-01-02T02:00:00Z'),
			updated_at: new Date('2017-01-02T02:00:00Z'),
			url: 'https://github.com/Financial-Times/mock-long-time',
			tag: 'v1.0.0',
			ingestion_started_at: new Date('2017-01-02T02:00:00Z')
		}
	]);

};
