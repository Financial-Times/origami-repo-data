'use strict';

const httpError = require('http-errors');

module.exports = requireAuth;

module.exports.READ = Symbol('read');
module.exports.WRITE = Symbol('write');
module.exports.ADMIN = Symbol('admin');

const levels = [
	module.exports.READ,
	module.exports.WRITE,
	module.exports.ADMIN
];

function requireAuth(level) {
	if (!levels.includes(level)) {
		throw new TypeError('Level is required, and must be one of the permission level symbols');
	}
	return async (request, response, next) => {
		const apiKey = request.headers['x-api-key'] || request.query.apiKey || null;
		const apiSecret = request.headers['x-api-secret'] || request.query.apiSecret || null;
		if (!apiKey || !apiSecret) {
			return next(httpError(
				401,
				'An API key/secret pair is required to use this service. Please provide X-Api-Key and X-Api-Secret headers'
			));
		}
		const key = await request.app.model.Key.fetchById(apiKey);
		const secretIsValid = (key ? await request.app.model.Key.compare(apiSecret, key.get('secret')) : false);
		if (!key || !secretIsValid) {
			return next(httpError(
				401,
				'Invalid credentials'
			));
		}
		let authorised = false;
		switch (level) {
			case module.exports.READ:
				authorised = key.get('read');
				break;
			case module.exports.WRITE:
				authorised = key.get('write');
				break;
			case module.exports.ADMIN:
				authorised = key.get('admin');
				break;
		}
		if (!authorised) {
			return next(httpError(
				403,
				'You are not authorised to perform this request'
			));
		}
		request.authenticatedKey = key;
		next();
	};
}
