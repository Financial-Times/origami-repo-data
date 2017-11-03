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
		const userKey = request.headers['x-api-key'] || request.query.apiKey || null;
		if (!userKey) {
			return next(httpError(
				401,
				'An API key is required to use this service, please provide one in an X-Api-Key header'
			));
		}
		const key = await request.app.model.Key.fetchByKey(userKey);
		if (!key) {
			return next(httpError(
				401,
				'The provided API key is invalid, it may have been revoked'
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
		next();
	};
}
