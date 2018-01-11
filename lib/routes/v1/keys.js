'use strict';

const bodyParser = require('body-parser');
const cacheControl = require('@financial-times/origami-service').middleware.cacheControl;
const httpError = require('http-errors');
const requireAuth = require('../../middleware/require-auth');

module.exports = app => {

	const parseJsonBody = bodyParser.json();
	const neverCache = cacheControl({
		maxAge: 0
	});

	// Create a key
	app.post('/v1/keys', requireAuth(requireAuth.ADMIN), neverCache, parseJsonBody, async (request, response, next) => {
		try {
			const secret = app.model.Key.generateSecret();
			const key = new app.model.Key({
				secret: secret,
				description: request.body.description,
				read: request.body.read,
				write: request.body.write,
				admin: request.body.admin,
			});
			await key.save();
			response.status(201).send({
				id: key.get('id'),
				secret: secret
			});
		} catch (error) {
			if (error.name === 'ValidationError') {
				return response.status(400).send({
					message: 'Validation failed',
					validation: error.details.map(detail => detail.message),
					status: 400
				});
			}
			next(error);
		}
	});

	// List of all of the keys
	app.get('/v1/keys', requireAuth(requireAuth.ADMIN), neverCache, async (request, response, next) => {
		try {
			response.send(await app.model.Key.fetchAll());
		} catch (error) {
			next(error);
		}
	});

	// Single key
	app.get('/v1/keys/:keyId', requireAuth(requireAuth.ADMIN), neverCache, async (request, response, next) => {
		try {
			const key = await app.model.Key.fetchById(request.params.keyId);
			if (!key) {
				return next();
			}
			response.send(key);
		} catch (error) {
			next(error);
		}
	});

	// Delete a key
	app.delete('/v1/keys/:keyId', requireAuth(requireAuth.ADMIN), neverCache, async (request, response, next) => {
		try {
			if (request.params.keyId === request.authenticatedKey.get('id')) {
				return next(httpError(403, 'You are not authorized to delete your own key'));
			}
			const key = await app.model.Key.fetchById(request.params.keyId);
			if (!key) {
				return next();
			}
			await key.destroy();
			response.status(204).send();
		} catch (error) {
			next(error);
		}
	});

};
