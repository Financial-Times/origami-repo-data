'use strict';

module.exports = app => {

	// Redirect to current API version
	app.get('/', (request, response) => {
		response.redirect(301, `${request.basePath}v1`);
	});

};
