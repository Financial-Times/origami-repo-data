'use strict';

const cacheControl = require('@financial-times/origami-service').middleware.cacheControl;
const httpError = require('http-errors');
const requireAuth = require('../../middleware/require-auth');

module.exports = app => {

	const cacheForFiveMinutes = cacheControl({
		maxAge: '5 minutes',
		staleWhileRevalidate: '7 days',
		staleIfError: '7 days'
	});

	// Handle the `repoID` parameter, loading the relevant repo or redirecting
	app.param('repoId', async (request, response, next, repoId) => {
		let repo = await app.model.Version.fetchLatestByRepoId(repoId);
		if (!repo) {
			repo = await app.model.Version.fetchLatestByRepoName(repoId);
			if (repo) {
				const url = request.url.replace(repoId, repo.get('repo_id'));
				return response.redirect(307, url);
			} else {
				return next(httpError(404));
			}
		}
		request.repo = repo;
		next();
	});

	// Handle the `versionId` parameter, loading the relevant version or redirecting
	app.param('versionId', async (request, response, next, versionId) => {
		if (!request.repo) {
			return next(httpError(404));
		}
		let version = await app.model.Version.fetchByRepoIdAndVersionId(request.repo.get('repo_id'), versionId);
		if (!version) {
			version = await app.model.Version.fetchByRepoIdAndVersionNumber(request.repo.get('repo_id'), versionId);
			if (version) {
				const url = request.url.replace(versionId, version.get('id'));
				return response.redirect(307, url);
			} else {
				return next(httpError(404));
			}
		}
		request.version = version;
		next();
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
			response.send({
				repo: request.repo.serializeAsRepo()
			});
		} catch (error) {
			next(error);
		}
	});

	// List of all versions of a given repository
	app.get('/v1/repos/:repoId/versions', requireAuth(requireAuth.READ), cacheForFiveMinutes, async (request, response, next) => {
		try {
			response.send({
				versions: await app.model.Version.fetchByRepoId(request.repo.get('repo_id'))
			});
		} catch (error) {
			next(error);
		}
	});

	// Single version
	app.get('/v1/repos/:repoId/versions/:versionId', requireAuth(requireAuth.READ), cacheForFiveMinutes, async (request, response, next) => {
		try {
			response.send({
				version: request.version
			});
		} catch (error) {
			next(error);
		}
	});

	// Single version manifest
	app.get('/v1/repos/:repoId/versions/:versionId/manifests/:manifestType', requireAuth(requireAuth.READ), cacheForFiveMinutes, async (request, response, next) => {
		try {
			const manifest = request.version.get('manifests')[request.params.manifestType];
			if (!manifest) {
				return next(httpError(404));
			}
			response.send(manifest);
		} catch (error) {
			next(error);
		}
	});

	// Single version markdown
	app.get('/v1/repos/:repoId/versions/:versionId/markdown/:markdownType', requireAuth(requireAuth.READ), cacheForFiveMinutes, async (request, response, next) => {
		try {
			const markdownDocument = request.version.get('markdown')[request.params.markdownType];
			if (!markdownDocument) {
				return next(httpError(404));
			}
			response.set('Content-Type', 'text/markdown').send(markdownDocument);
		} catch (error) {
			next(error);
		}
	});

};
