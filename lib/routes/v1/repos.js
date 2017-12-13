'use strict';

const cacheControl = require('@financial-times/origami-service').middleware.cacheControl;
const requireAuth = require('../../middleware/require-auth');
const semver = require('semver');

module.exports = app => {

	const cacheForFiveMinutes = cacheControl({
		maxAge: '5 minutes',
		staleWhileRevalidate: '7 days',
		staleIfError: '7 days'
	});

	// List of all of the repositories
	app.get('/v1/repos', requireAuth(requireAuth.READ), cacheForFiveMinutes, async (request, response, next) => {
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
	app.get('/v1/repos/:repoId', requireAuth(requireAuth.READ), cacheForFiveMinutes, async (request, response, next) => {
		try {
			const repo = await app.model.Version.fetchLatestByRepoId(request.params.repoId);
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
	app.get('/v1/repos/:repoId/versions', requireAuth(requireAuth.READ), cacheForFiveMinutes, async (request, response, next) => {
		try {
			const versions = await app.model.Version.fetchByRepoId(request.params.repoId);
			if (!versions || versions.length === 0) {
				return next();
			}
			response.send({versions});
		} catch (error) {
			next(error);
		}
	});

	// Single version
	app.get('/v1/repos/:repoId/versions/:versionId', requireAuth(requireAuth.READ), cacheForFiveMinutes, async (request, response, next) => {
		try {
			let version;

			// Semver shortcut/redirect
			if (semver.valid(request.params.versionId)) {
				version = await app.model.Version.fetchByRepoIdAndVersionNumber(request.params.repoId, request.params.versionId);
				if (!version) {
					return next();
				}
				response.redirect(307, `${request.basePath}v1/repos/${request.params.repoId}/versions/${version.get('id')}`);

			// ID-based lookup
			} else {
				version = await app.model.Version.fetchByRepoIdAndVersionId(request.params.repoId, request.params.versionId);
				if (!version) {
					return next();
				}
				response.send({version});
			}

		} catch (error) {
			next(error);
		}
	});

};
