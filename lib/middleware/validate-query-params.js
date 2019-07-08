'use strict';

const httpError = require('http-errors');
const { list, rule, validate } = require('guestlist');

module.exports = ({ errorFor } = { errorFor: []} ) => {

	// - brand
	//  	At the time of writing our brands are all alphanumeric, but there is
	//		no brand name specification, so be open to brands that are lowercase
	//      alphanumeric characters with dashes (or a comma-delimited list of
	//      them). This includes "none", "null", or "undefined" strings to
	//      indicate a request for unbranded components.
	const safelist = list().add('brand', rule().matches(/^[a-z0-9-,]*$/));

	return async (request, response, next) => {
		request.validQuery = validate(request, safelist);

		if (errorFor.includes('brand') && request.query.brand && !request.validQuery.brand) {
			return next(httpError(400, 'The "brand" parameter is optional but must only contain brands of lowercase alphanumeric characters with dashes (or a comma-delimited list of these).'));
		}

		next();
	};

};
