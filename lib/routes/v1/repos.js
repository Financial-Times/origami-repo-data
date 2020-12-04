'use strict';

const cacheControl = require('@financial-times/origami-service').middleware.cacheControl;
const httpError = require('http-errors');
const requireAuth = require('../../middleware/require-auth');
const validateQueryParams = require('../../middleware/validate-query-params');

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

	// Handle the `language` parameter
	app.param('language', async (request, response, next, language) => {
		if (!request.repo) {
			return next(httpError(404));
		}
		const languages = ['js', 'css'];

		if (languages.includes(language) === false) {
			return next(httpError(400, `Bundle language must be one of: ${languages}.`));
		}

		request.language = language;
		next();
	});

	// List of all of the repositories
	app.get('/v1/repos', validateQueryParams({ errorFor: ['brand'] }), cacheForFiveMinutes, async (request, response, next) => {

		// Get search filters
		const filters = {
			brand: request.validQuery.brand,
			type: request.query.type,
			status: request.query.status,
			supportEmail: request.query.supportEmail,
			search: request.query.q,
			origamiVersion: request.query.origamiVersion,
		};

		const hasFilters = Object.values(filters).filter(Boolean).length >= 1;

		try {
			const repos = (
				hasFilters ?
				await app.model.Version.fetchFilteredRepos(filters) :
				await app.model.Version.fetchRepos()
			);
			response.send(repos.map(version => version.serializeAsRepo()));
		} catch (error) {
			next(error);
		}
	});

	// Single repository
	app.get('/v1/repos/:repoId', cacheForFiveMinutes, async (request, response, next) => {
		try {
			response.send(request.repo.serializeAsRepo());
		} catch (error) {
			next(error);
		}
	});

	// List of all versions of a given repository
	app.get('/v1/repos/:repoId/versions', cacheForFiveMinutes, async (request, response, next) => {
		try {
			response.send(await app.model.Version.fetchByRepoId(request.repo.get('repo_id')));
		} catch (error) {
			next(error);
		}
	});

	// Single version
	app.get('/v1/repos/:repoId/versions/:versionId', cacheForFiveMinutes, async (request, response, next) => {
		try {
			response.send(request.version);
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

	// Single version demos
	app.get('/v1/repos/:repoId/versions/:versionId/demos', validateQueryParams({ errorFor: ['brand'] }), cacheForFiveMinutes, async (request, response, next) => {
		try {
			const demos = request.version.demos({
				brand: request.validQuery.brand
			});
			if (!demos) {
				return next(httpError(404));
			}
			response.send(demos);
		} catch (error) {
			next(error);
		}
	});

	// Single version images
	app.get('/v1/repos/:repoId/versions/:versionId/images', cacheForFiveMinutes, async (request, response, next) => {
		try {
			const images = request.version.images(request.query.sourceParam || undefined);
			if (!images) {
				return next(httpError(404));
			}
			response.send(images);
		} catch (error) {
			next(error);
		}
	});

	// Single version dependencies
	app.get('/v1/repos/:repoId/versions/:versionId/dependencies', requireAuth(requireAuth.READ), cacheForFiveMinutes, async (request, response, next) => {
		try {
			const dependencies = request.version.dependencies();
			if (!dependencies) {
				return next(httpError(404));
			}
			response.send(dependencies);
		} catch (error) {
			next(error);
		}
	});

	// Single version bundles
	app.get('/v1/repos/:repoId/versions/:versionId/bundles/:language', validateQueryParams({ errorFor: ['brand'] }), cacheForFiveMinutes, async (request, response, next) => {
		try {
			const bundles = await app.model.Bundle.fetchByVersionIdAndBrand(request.version.get('id'), request.validQuery.brand, request.language);
			response.send(bundles.map(bundle => bundle.serialize()));
		} catch (error) {
			next(error);
		}
	});

};
