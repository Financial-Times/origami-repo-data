'use strict';

const normaliseOrigamiManifest = require('./normalise-origami-manifest');
const getVersionLanguages = require('./get-version-languages');
const fs = require('fs').promises;
const fileExists = require('fs').existsSync;
const path = require('path');
const downloadAndUnpackPackage = require('./downloadAndUnpackPackage');

/**
 * Create a Version for a given Ingestion.
 *
 * @param {Ingestion} ingestion - the ingestion instance to create a version for
 * @param {Version} Version - the app's instantiated Version model
 * @param {GitHubClient} githubClient - the app's github client wrapper
 *
 * @returns void
 */
async function createVersionFromGitHubIngestion(ingestion, Version, githubClient) {
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

		const languages = await getVersionLanguages(
			origamiManifest,
			bowerManifest,
			packageManifest,
			tag,
			owner,
			repo,
			githubClient
		);

		// Create the new version
		const version = new Version({
			name: repo,
			type: origamiManifestNormalised.origamiType,
			url,
			tag,
			languages: JSON.stringify(languages),
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

/**
 * Create a Version for a given Ingestion.
 *
 * @param {Ingestion} ingestion - the ingestion instance to create a version for
 * @param {Version} Version - the app's instantiated Version model
 * @returns void
 */
 async function createVersionFromNpmIngestion(ingestion, Version) {
	try {
		const packageName = ingestion.get('packageName');
		const tag = ingestion.get('version');

		await fs.mkdir('/tmp/demo/', {recursive: true});
		const location = await fs.mkdtemp('/tmp/demo/');
		
		await downloadAndUnpackPackage(location, packageName, tag);

		// Load the Origami manifest first
		const origamiManifestPath = path.join(location, 'origami.json');
		const origamiManifestExists = fileExists(origamiManifestPath);
		if (!origamiManifestExists) {
			const error = new Error(`NPM package '${packageName}@${tag}' does not contain an origami.json file.`);
			error.isRecoverable = false;
			throw error;
		}

		let origamiManifest;
		try {
			origamiManifest = JSON.parse(await fs.readFile(origamiManifestPath, 'utf-8'));
		} catch (err) {
			const error = new Error(`NPM package '${packageName}@${tag}' origami.json file is not valid JSON.`);
			error.isRecoverable = false;
			throw error;
		}

		// Extract the information we need from the Origami manifest
		const origamiManifestNormalised = normaliseOrigamiManifest(origamiManifest);

		// Load the other manifests
		const packageManifestPath = path.join(location, 'package.json');
		const packageManifestExists = fileExists(packageManifestPath);
		if (!packageManifestExists) {
			const error = new Error(`NPM package '${packageName}@${tag}' does not contain a package.json file.`);
			error.isRecoverable = false;
			throw error;
		}
		let packageManifest;
		try {
			packageManifest = JSON.parse(await fs.readFile(packageManifestPath, 'utf-8'));
		} catch (err) {
			const error = new Error(`NPM package '${packageName}@${tag}' package.json file is not valid JSON.`);
			error.isRecoverable = false;
			throw error;
		}

		// Load repo markdown
		let readme;
		try {
			readme = await Promise.any([
				fs.readFile(path.join(location, 'README.md'), 'utf-8'),
				fs.readFile(path.join(location, 'readme.md'), 'utf-8'),
			]);
		} catch (err) {
			const error = new Error(`NPM package '${packageName}@${tag}' does not contain a README.md file.`);
			error.isRecoverable = false;
			throw error;
		}
		
		const designguidelinesPath = path.join(location, 'designguidelines.md');
		let designguidelines;
		if (fileExists(designguidelinesPath)) {
			designguidelines = await fs.readFile(designguidelinesPath, 'utf-8');
		}
		const migrationPath = path.join(location, 'migration.md');
		let migration;
		if (fileExists(migrationPath)) {
			migration = await fs.readFile(migrationPath, 'utf-8');
		}

		const languages = [];
		if (fileExists(path.join(location, 'main.scss'))) {
			languages.push('scss');
		}
		if (packageManifest && packageManifest.browser) {
			languages.push('js');
		}
		const name = packageName.replace('@financial-times/', '');
		const url = `https://github.com/Financial-Times/${name}`;

		// Create the new version
		const version = new Version({
			name,
			type: origamiManifestNormalised.origamiType,
			url,
			tag,
			languages: JSON.stringify(languages),
			support_status: origamiManifestNormalised.supportStatus,
			support_email: origamiManifestNormalised.supportContact.email,
			support_channel: origamiManifestNormalised.supportContact.slack,
			manifests: {
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

/**
 * Create a Version for a given Ingestion.
 *
 * @param {Ingestion} ingestion - the ingestion instance to create a version for
 * @param {Version} version - the app's instantiated Version model
 * @param {GitHubClient} githubClient - the app's github client wrapper
 *
 * @returns void
 */
module.exports = async function createVersionFromIngestion(ingestion, version, githubClient) {
	try {
		const type = ingestion.get('type');
		if (ingestion.get('type') === 'version') {
			return createVersionFromGitHubIngestion(ingestion, version, githubClient);
		} else if (ingestion.get('type') === 'npm') {
			return createVersionFromNpmIngestion(ingestion, version);
		} else {
			const error = new Error(`Ingestions of type '${type}' are not supported. Only 'version' and 'npm' ingestion types are supported`);
			error.isRecoverable = false;
			throw error;
		}

	} catch (error) {
		// Assume errors are recoverable by default
		if (error.isRecoverable !== false) {
			error.isRecoverable = true;
		}
		throw error;
	}

};
