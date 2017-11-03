'use strict';

// Create keys with different access levels
exports.seed = async database => {
	await database('keys').insert([
		{
			id: '1b0a64e9-ce8c-4246-9356-3858e8b25804',
			name: 'mock admin key',
			key: 'mock-admin-key',
			read: true,
			write: true,
			admin: true
		},
		{
			id: 'd4169f7a-33e8-4596-bbe2-9fa669d993fd',
			name: 'mock write key',
			key: 'mock-write-key',
			read: true,
			write: true,
			admin: false
		},
		{
			id: 'd591f731-4a24-4ced-af9c-482df059f6ef',
			name: 'mock read key',
			key: 'mock-read-key',
			read: true,
			write: false,
			admin: false
		},
		{
			id: '86474c4d-d4dc-44c7-9d02-c2cdc667bb2c',
			name: 'mock no key',
			key: 'mock-no-key',
			read: false,
			write: false,
			admin: false
		}
	]);

};
