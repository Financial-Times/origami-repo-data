'use strict';

const cacheControl = require('@financial-times/origami-service').middleware.cacheControl;

module.exports = app => {

	const cacheForSevenDays = cacheControl({
		maxAge: '7d'
	});

	// API documentation page
	app.get('/v1/docs/api', cacheForSevenDays, (request, response) => {
		response.render('api', {
			title: `API Reference - ${app.origami.options.name}`
		});
	});

};
