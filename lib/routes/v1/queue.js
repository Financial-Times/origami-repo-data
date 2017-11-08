'use strict';

const bodyParser = require('body-parser');
const cacheControl = require('@financial-times/origami-service').middleware.cacheControl;
const requireAuth = require('../../middleware/require-auth');

module.exports = app => {

	const parseJsonBody = bodyParser.json();
	const neverCache = cacheControl({
		maxAge: 0
	});

	// Create an item in the ingestion queue
	app.post('/v1/queue', requireAuth(requireAuth.WRITE), neverCache, parseJsonBody, async (request, response, next) => {
		try {
			const ingestion = new app.model.Ingestion({
				url: request.body.url,
				tag: request.body.tag
			});
			await ingestion.save();
			response.status(201).send({ingestion});
		} catch (error) {
			if (error.name === 'ValidationError') {
				return response.status(400).render('error', {
					title: 'Error 400',
					error: {
						isValidationError: true,
						details: error.details
					}
				});
			}
			next(error);
		}
	});

	// List of all of the items in the ingestion queue
	app.get('/v1/queue', requireAuth(requireAuth.READ), neverCache, async (request, response, next) => {
		try {
			response.send({
				queue: await app.model.Ingestion.fetchAll()
			});
		} catch (error) {
			next(error);
		}
	});

	// Single ingestion queue item
	app.get('/v1/queue/:ingestionId', requireAuth(requireAuth.READ), neverCache, async (request, response, next) => {
		try {
			const ingestion = await app.model.Ingestion.fetchById(request.params.ingestionId);
			if (!ingestion) {
				return next();
			}
			response.send({ingestion});
		} catch (error) {
			next(error);
		}
	});

	// Delete an ingestion
	app.delete('/v1/queue/:ingestionId', requireAuth(requireAuth.ADMIN), neverCache, async (request, response, next) => {
		try {
			const ingestion = await app.model.Ingestion.fetchById(request.params.ingestionId);
			if (!ingestion) {
				return next();
			}
			await ingestion.destroy();
			response.status(204).send();
		} catch (error) {
			next(error);
		}
	});

};
