'use strict';

const bodyParser = require('body-parser');
const cacheControl = require('@financial-times/origami-service').middleware.cacheControl;
const httpError = require('http-errors');
const requireAuth = require('../../middleware/require-auth');
const semver = require('semver');

module.exports = app => {

	const parseJsonBody = bodyParser.json();
	const neverCache = cacheControl({
		maxAge: 0
	});

	// Create an item in the ingestion queue
	app.post('/v1/queue', requireAuth(requireAuth.WRITE), neverCache, parseJsonBody, async (request, response, next) => {
		try {

			// Work out where the data is coming from. This can either
			// be a GitHub webhook or sent by a user

			// The request is likely to be a GitHub webhook
			if (request.headers['x-github-event']) {

				// We only support the "create" GitHub webhook event
				if (request.headers['x-github-event'] !== 'create') {
					throw httpError(400, 'Only the "create" GitHub event is supported');
				}

				// We only want tag references
				// (but can't error here because it's impossible to subscribe to only tags)
				if (request.body.ref_type !== 'tag') {
					return response
						.status(202)
						.set('Content-Type', 'text/plain')
						.send('We only need to process tag references');
				}

				// We only want valid semver tags
				// (but can't error here because it's impossible to subscribe to only semver tags)
				if (!request.body.ref || !semver.valid(request.body.ref)) {
					return response
						.status(202)
						.set('Content-Type', 'text/plain')
						.send('The tag is not a valid semantic version');
				}

				// We require a repository URL
				// (we can error here because GitHub commits to providing a valid repository)
				if (!request.body.repository || !request.body.repository.html_url) {
					throw httpError(400, 'A repository URL is required');
				}

				// Save the ingestion
				const ingestion = new app.model.Ingestion({
					url: request.body.repository.html_url,
					tag: request.body.ref
				});
				await ingestion.save();
				response
					.status(201)
					.set('Content-Type', 'text/plain')
					.send('OK');

			// The request is likely to have been made by a user
			} else {

				// Save the ingestion
				const ingestion = new app.model.Ingestion({
					url: request.body.url,
					tag: request.body.tag
				});
				await ingestion.save();
				response.status(201).send(ingestion);

			}

		} catch (error) {
			if (error.name === 'ValidationError') {
				const status = (error.isConflict ? 409 : 400);
				return response.status(status).send({
					message: 'Validation failed',
					validation: error.details.map(detail => detail.message),
					status: status
				});
			}
			next(error);
		}
	});

	// List of all of the items in the ingestion queue
	app.get('/v1/queue', requireAuth(requireAuth.READ), neverCache, async (request, response, next) => {
		try {
			response.send(await app.model.Ingestion.fetchAll());
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
			response.send(ingestion);
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
