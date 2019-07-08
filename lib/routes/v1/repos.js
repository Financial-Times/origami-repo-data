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

	// Handle the `bundleType` parameter
	app.param('bundleType', async (request, response, next, bundleType) => {
		if (!request.repo) {
			return next(httpError(404));
		}
		const expectedBundleTypes = ['js', 'css'];

		if (expectedBundleTypes.includes(bundleType) === false) {
			return next(httpError(400, `Bundle type must be one of: ${expectedBundleTypes}.`));
		}

		request.bundleType = bundleType;
		next();
	});

	// Handle the `brand` query parameter
	app.param('bundleType', async (request, response, next, bundleType) => {
		if (!request.repo) {
			return next(httpError(404));
		}
		const expectedBundleTypes = ['js', 'css'];

		if (expectedBundleTypes.includes(bundleType) === false) {
			return next(httpError(400, `Bundle type must be one of: ${expectedBundleTypes}.`));
		}

		request.bundleType = bundleType;
		next();
	});

	// List of all of the repositories
	app.get('/v1/repos', requireAuth(requireAuth.READ), validateQueryParams({ errorFor: ['brand'] }), cacheForFiveMinutes, async (request, response, next) => {

		// Get search filters
		const filters = {
			brand: request.validQuery.brand,
			type: request.query.type,
			status: request.query.status,
			search: request.query.q
		};
		const hasFilters = (
			filters.brand ||
			filters.type ||
			filters.status ||
			filters.search
		);

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
	app.get('/v1/repos/:repoId', requireAuth(requireAuth.READ), cacheForFiveMinutes, async (request, response, next) => {
		try {
			response.send(request.repo.serializeAsRepo());
		} catch (error) {
			next(error);
		}
	});

	// List of all versions of a given repository
	app.get('/v1/repos/:repoId/versions', requireAuth(requireAuth.READ), cacheForFiveMinutes, async (request, response, next) => {
		try {
			response.send(await app.model.Version.fetchByRepoId(request.repo.get('repo_id')));
		} catch (error) {
			next(error);
		}
	});

	// List of bundles of a given repository
	app.get('/v1/repos/:repoId/bundles/:bundleType', requireAuth(requireAuth.READ), validateQueryParams({ errorFor: ['brand'] }), cacheForFiveMinutes, async (request, response, next) => {
		try {
			const bundles = await app.model.Bundle.fetchByRepoIdAndBrand(request.repo.get('repo_id'), request.bundleType, request.validQuery.brand);
			response.send(bundles.map(bundle => bundle.serializeWithVersionName()));
		} catch (error) {
			next(error);
		}
	});

	// Single version
	app.get('/v1/repos/:repoId/versions/:versionId', requireAuth(requireAuth.READ), cacheForFiveMinutes, async (request, response, next) => {
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
	app.get('/v1/repos/:repoId/versions/:versionId/demos', requireAuth(requireAuth.READ), validateQueryParams({ errorFor: ['brand'] }), cacheForFiveMinutes, async (request, response, next) => {
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
	app.get('/v1/repos/:repoId/versions/:versionId/images', requireAuth(requireAuth.READ), cacheForFiveMinutes, async (request, response, next) => {
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

};
