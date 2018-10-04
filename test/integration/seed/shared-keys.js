'use strict';

const bcrypt = require('bcrypt');

// Create keys with different access levels
exports.seed = async database => {
	await database('keys').insert([
		{
			id: 'mock-admin-key',
			created_at: new Date('2017-01-01T08:00:00Z'),
			updated_at: new Date('2017-01-01T08:00:00Z'),
			secret: await bcrypt.hash('mock-admin-secret', 5),
			description: 'mock admin key',
			read: true,
			write: true,
			admin: true
		},
		{
			id: 'mock-write-key',
			created_at: new Date('2017-01-01T07:00:00Z'),
			updated_at: new Date('2017-01-01T07:00:00Z'),
			secret: await bcrypt.hash('mock-write-secret', 5),
			description: 'mock write key',
			read: true,
			write: true,
			admin: false
		},
		{
			id: 'mock-read-key',
			created_at: new Date('2017-01-01T06:00:00Z'),
			updated_at: new Date('2017-01-01T06:00:00Z'),
			secret: await bcrypt.hash('mock-read-secret', 5),
			description: 'mock read key',
			read: true,
			write: false,
			admin: false
		},
		{
			id: 'mock-no-key',
			created_at: new Date('2017-01-01T05:00:00Z'),
			updated_at: new Date('2017-01-01T05:00:00Z'),
			secret: await bcrypt.hash('mock-no-secret', 5),
			description: 'mock no key',
			read: false,
			write: false,
			admin: false
		}
	]);

};
