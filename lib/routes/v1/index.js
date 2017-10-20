'use strict';

const cacheControl = require('@financial-times/origami-service').middleware.cacheControl;

module.exports = app => {

	const cacheForSevenDays = cacheControl({
		maxAge: '7d'
	});

	// Home page
	app.get('/v1/', cacheForSevenDays, (request, response) => {
		response.render('index', {
			layout: 'main',
			title: app.origami.options.name
		});
	});

};
