'use strict';

const httpError = require('http-errors');
const { list, rule, validate } = require('guestlist');

module.exports = ({ errorFor } = { errorFor: []} ) => {

	const safelist = list()
		.add('brand', rule().isIn(['master', 'internal', 'whitelabel']));

	return async (request, response, next) => {
		request.validQuery = validate(request, safelist);

		if (errorFor.includes('brand') && request.query.brand && !request.validQuery.brand) {
			return next(httpError(400, 'The "brand" parameter is optional but must be one of master, internal, or whitelabel.'));
		}

		next();
	};

};
