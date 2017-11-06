'use strict';

const bcrypt = require('bcrypt');

exports.seed = async database => {

	// Create some keys to test with
	await database('keys').insert([
		{
			id: '1b0a64e9-ce8c-4246-9356-3858e8b25804',
			secret: await bcrypt.hash('secret-key', 5), // Only for use in local demos
			description: 'Origami admin access',
			read: true,
			write: true,
			admin: true
		},
		{
			id: 'd4169f7a-33e8-4596-bbe2-9fa669d993fd',
			secret: await bcrypt.hash('secret-key', 5), // Only for use in local demos
			description: 'Example write access',
			read: true,
			write: true,
			admin: false
		},
		{
			id: 'd591f731-4a24-4ced-af9c-482df059f6ef',
			secret: await bcrypt.hash('secret-key', 5), // Only for use in local demos
			description: 'Example read access',
			read: true,
			write: false,
			admin: false
		},
		{
			id: '86474c4d-d4dc-44c7-9d02-c2cdc667bb2c',
			secret: await bcrypt.hash('secret-key', 5), // Only for use in local demos
			description: 'Example no access',
			read: false,
			write: false,
			admin: false
		}
	]);

};
