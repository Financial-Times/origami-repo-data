'use strict';

const cacheControl = require('@financial-times/origami-service').middleware.cacheControl;

module.exports = app => {

	const cacheForSevenDays = cacheControl({
		maxAge: '7d'
	});

	// API documentation pages
	const endpoints = [
		{
			path: '',
			view: 'api/index',
			title: 'API Reference'
		},
		{
			path: '/authentication',
			view: 'api/authentication',
			title: 'Authentication - API Reference'
		},
		{
			path: '/repositories',
			view: 'api/repositories',
			title: 'Repository Endpoints - API Reference'
		},
		{
			path: '/keys',
			view: 'api/keys',
			title: 'API Key Endpoints - API Reference'
		}
	];
	endpoints.forEach(endpoint => {
		app.get(`/v1/docs/api${endpoint.path}`, cacheForSevenDays, (request, response) => {
			response.render(endpoint.view, {
				title: `${endpoint.title} - ${app.origami.options.name}`
			});
		});
	});

};
