'use strict';

const cacheControl = require('@financial-times/origami-service').middleware.cacheControl;
const navigation = require('../../../../data/navigation.json');

module.exports = app => {

	const cacheForSevenDays = cacheControl({
		maxAge: '7d'
	});

	// API documentation pages
	const endpoints = [
		{
			path: '',
			view: 'api/index',
			title: 'API Reference',
			name: 'Index'
		},
		{
			path: '/clients',
			view: 'api/clients',
			title: 'Clients - API Reference',
			name: 'Clients'
		},
		{
			path: '/authentication',
			view: 'api/authentication',
			title: 'Authentication - API Reference',
			name: 'Authentication'
		},
		{
			path: '/repositories',
			view: 'api/repositories',
			title: 'Repository Endpoints - API Reference',
			name: 'Repository'
		},
		{
			path: '/queue',
			view: 'api/queue',
			title: 'Ingeston Queue Endpoints - API Reference',
			name: 'Queue'
		},
		{
			path: '/keys',
			view: 'api/keys',
			title: 'API Key Endpoints - API Reference',
			name: 'Keys'
		}
	];
	endpoints.forEach(endpoint => {
		app.get(`/v1/docs/api${endpoint.path}`, cacheForSevenDays, (request, response) => {
			navigation.main[1].current = true;
			navigation.hasChildren = true;
			navigation.children.find(child => child.current = (child.name === endpoint.name) ? true : false);
			response.render(endpoint.view, {
				title: `${endpoint.title} - ${app.origami.options.name}`,
				navigation
			});
		});
	});

};
