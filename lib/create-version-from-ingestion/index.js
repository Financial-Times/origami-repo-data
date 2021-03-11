'use strict';

const cloneDeep = require('lodash/cloneDeep');

/**
 * Create a Version for a given Ingestion.
 *
 * @param {Ingestion} ingestion - the ingestion instance to create a version for
 * @param {Version} Version - the app's instantiated Version model
 * @param {GitHubClient} githubClient - the app's github client wrapper
 *
 * @returns void
 */
module.exports = async function createVersionFromIngestion(ingestion, Version, githubClient) {
	try {
		const url = ingestion.get('url');
		const tag = ingestion.get('tag');
		const encodedTag = encodeURIComponent(tag);

		// Expect a valid GitHub URL
		if (!githubClient.isValidUrl(url)) {
			throw githubClient.error('Ingestion URL is not a GitHub repository', false);
		}
		const { owner, repo } = githubClient.extractRepoFromUrl(url);

		// Check that the repo/tag exist
		const repoTagExists = await githubClient.isValidRepoAndTag({
			owner,
			repo,
			tag: encodedTag
		});
		if (!repoTagExists) {
			throw githubClient.error('Repo or tag does not exist', false);
		}

		// Load the Origami manifest first
		const origamiManifest = await githubClient.loadJsonFile({
			path: 'origami.json',
			ref: tag,
			owner,
			repo
		});
		if (!origamiManifest) {
			throw githubClient.error('Repo does not contain an Origami manifest', false);
		}

		// Extract the information we need from the Origami manifest
		const origamiManifestNormalised = normaliseOrigamiManifest(origamiManifest);

		// Load the other manifests
		const [aboutManifest, bowerManifest, imageSetManifest, packageManifest] = await Promise.all([
			githubClient.loadJsonFile({
				path: 'about.json',
				ref: tag,
				owner,
				repo
			}),
			githubClient.loadJsonFile({
				path: 'bower.json',
				ref: tag,
				owner,
				repo
			}),
			githubClient.loadJsonFile({
				path: 'imageset.json',
				ref: tag,
				owner,
				repo
			}),
			githubClient.loadJsonFile({
				path: 'package.json',
				ref: tag,
				owner,
				repo
			})
		]);

		// Load repo markdown
		const readme = await githubClient.loadReadme({
			ref: tag,
			owner,
			repo
		});
		const designguidelines = await githubClient.loadFile({
			path: 'designguidelines.md',
			ref: tag,
			owner,
			repo
		});
		const migration = await githubClient.loadFile({
			path: 'migration.md',
			ref: tag,
			owner,
			repo
		});

		// Create the new version
		const version = new Version({
			name: repo,
			type: origamiManifestNormalised.origamiType,
			url,
			tag,
			support_status: origamiManifestNormalised.supportStatus,
			support_email: origamiManifestNormalised.supportContact.email,
			support_channel: origamiManifestNormalised.supportContact.slack,
			manifests: {
				about: aboutManifest,
				bower: bowerManifest,
				imageSet: imageSetManifest,
				origami: origamiManifest,
				package: packageManifest
			},
			markdown: {
				readme,
				designguidelines,
				migration
			}
		});
		await version.save();

		// Return the new version
		return version;

	} catch (error) {
		// Assume errors are recoverable by default
		if (error.isRecoverable !== false) {
			error.isRecoverable = true;
		}
		throw error;
	}

};

// Normalise an Origami manifest file. Because we use the manifest
// to create fields in the database, we need to ensure that it
// mostly conforms to the Origami spec.
function normaliseOrigamiManifest(manifest) {
	const origamiSupportEmail = 'origami.support@ft.com';

	const normalisedManifest = cloneDeep(manifest);

	// Ensure that origamiType is a string or null
	if (typeof normalisedManifest.origamiType !== 'string') {
		normalisedManifest.origamiType = null;
	}

	// Convert the "component" origamiType to "module" in the database
	if (normalisedManifest.origamiType === 'component') {
		normalisedManifest.origamiType = 'module';
	}

	// Ensure that support status is a string or null
	if (typeof normalisedManifest.support !== 'string') {
		normalisedManifest.support = null;
	}

	// Ensure that we have all the support information that we need
	if (typeof normalisedManifest.supportContact !== 'object' || normalisedManifest.supportContact === null) {
		normalisedManifest.supportContact = {
			email: null,
			slack: null
		};
	}
	if (!normalisedManifest.supportContact.email && typeof normalisedManifest.support === 'string' && normalisedManifest.support.includes('@')) {
		normalisedManifest.supportContact.email = normalisedManifest.support;
	}
	if (!normalisedManifest.supportContact.email) {
		normalisedManifest.supportContact.email = origamiSupportEmail;
	}
	if (!normalisedManifest.supportContact.slack && normalisedManifest.supportContact.email === origamiSupportEmail) {
		normalisedManifest.supportContact.slack = 'financialtimes/origami-support';
	}

	return normalisedManifest;
};