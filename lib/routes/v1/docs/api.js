'use strict';

const cacheControl = require('@financial-times/origami-service').middleware.cacheControl;
const defaultNavigation = require('../../../../data/navigation.json');
const clone = object => JSON.parse(JSON.stringify(object));

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
			name: 'Repositories'
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

			const navigation = clone(defaultNavigation);
			navigation.items
				.filter(item => item.href === 'v1/docs/api' && item.children)
				.forEach(item => {
					item.current = true;
					item.children
						.filter(child => child.href === `v1/docs/api${endpoint.path}`)
						.forEach(child => child.current = true);
				});

			response.render(endpoint.view, {
				title: `${endpoint.title}`,
				navigation
			});
		});
	});

};
