'use strict';

const cacheControl = require('@financial-times/origami-service').middleware.cacheControl;

module.exports = app => {

	const cacheForSevenDays = cacheControl({
		maxAge: '7d'
	});

	// List of all of the repositories
	app.get('/v1/repos', cacheForSevenDays, async (request, response, next) => {
		try {
			response.send({
				repos: (await app.model.Version.fetchLatest()).map(version => {
					return version.serializeAsRepo();
				})
			});
		} catch (error) {
			next(error);
		}
	});

	// Single repository
	// TODO change repo name to UUID!
	app.get('/v1/repos/:repoName', cacheForSevenDays, async (request, response, next) => {
		try {
			const repo = await app.model.Version.fetchLatestByName(request.params.repoName);
			if (!repo) {
				return next();
			}
			response.send({
				repo: repo.serializeAsRepo()
			});
		} catch (error) {
			next(error);
		}
	});

	// List of all versions of a given repository
	app.get('/v1/repos/:repoName/versions', cacheForSevenDays, async (request, response, next) => {
		try {
			const versions = await app.model.Version.fetchByName(request.params.repoName);
			if (!versions || versions.length === 0) {
				return next();
			}
			response.send({versions});
		} catch (error) {
			next(error);
		}
	});

};
