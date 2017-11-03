'use strict';

exports.seed = async database => {

	// Create some keys to test with
	await database('keys').insert([
		{
			id: '1b0a64e9-ce8c-4246-9356-3858e8b25804',
			name: 'Origami admin access',
			key: '8fa8ffe9-9cc8-413c-a86d-96e61e6ec8f4',
			read: true,
			write: true,
			admin: true
		},
		{
			id: 'd4169f7a-33e8-4596-bbe2-9fa669d993fd',
			name: 'Example write access',
			key: '696ccc15-883a-41f6-a2cf-4aefc4360292',
			read: true,
			write: true,
			admin: false
		},
		{
			id: 'd591f731-4a24-4ced-af9c-482df059f6ef',
			name: 'Example read access',
			key: 'c47106f5-865b-4655-8bb5-2c237b534467',
			read: true,
			write: false,
			admin: false
		},
		{
			id: '86474c4d-d4dc-44c7-9d02-c2cdc667bb2c',
			name: 'Example no access',
			key: 'f301745a-31c0-4fe1-a2d7-ad51d92167b7',
			read: false,
			write: false,
			admin: false
		}
	]);

};
