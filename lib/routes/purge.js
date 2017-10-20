'use strict';

const purgeUrls = require('@financial-times/origami-service').middleware.purgeUrls;

module.exports = app => {

	// Paths to purge
	const paths = [
		'/__about',
		'/',
		'/v1',
		'/v1/'
	];

	// Purge page
	app.post('/purge', purgeUrls({
		urls: paths.map(path => `https://origami-repo-data.ft.com${path}`)
	}));

};
