'use strict';

const cacheControl = require('@financial-times/origami-service').middleware.cacheControl;
const navigation = require('../../../data/navigation.json');

module.exports = app => {
	navigation.items.map(item => item.current = false);
	const neverCache = cacheControl({
		maxAge: 0
	});

	// Home page
	app.get('/v1/', neverCache, async (request, response, next) => {
		try {
			let setupCredentials;
			if (app.ft.options.enableSetupStep) {
				setupCredentials = await setupService(app);
			}
			navigation.items[0].current = true;
			response.render('index', {
				title: app.ft.options.name,
				setupCredentials: setupCredentials,
				navigation
			});
		} catch (error) {
			next(error);
		}
	});

	// Get the setup credentials
	async function setupService(app) {

		// If any keys already exist in the database,
		// return no credentials
		const existingKeys = await app.model.Key.fetchAll();
		if (existingKeys.length) {
			return;
		}

		// Create a new admin key and output the credentials
		const secret = app.model.Key.generateSecret();
		const key = new app.model.Key({
			secret: secret,
			description: 'Origami admin access',
			read: true,
			write: true,
			admin: true
		});
		await key.save();

		return {
			id: key.get('id'),
			secret: secret
		};

	}

};
