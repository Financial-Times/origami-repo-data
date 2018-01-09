'use strict';

const cloneDeep = require('lodash/cloneDeep');
const semver = require('semver');
const uuid = require('uuid/v4');
const uuidv5 = require('uuid/v5');
const union = require('lodash/union');

const origamiSupportEmail = 'origami.support@ft.com';

module.exports = initModel;

function initModel(app) {

	// Model prototypal methods
	const Version = app.database.Model.extend({
		tableName: 'versions',

		// Model initialization
		initialize() {

			// When a model is created...
			this.on('creating', () => {
				// Fill out automatic fields
				this.attributes.id = uuid();
				this.attributes.created_at = new Date();
			});

			// When a model is saved...
			this.on('saving', () => {
				// Fill out automatic fields
				this.attributes.repo_id = uuidv5(this.attributes.url, uuidv5.URL);
				this.attributes.version = Version.normaliseSemver(this.attributes.tag);
				this.attributes.updated_at = new Date();
				return this;
			});

		},

		// Override default serialization so we can control
		// what's output
		serialize() {
			return {
				id: this.get('id'),
				name: this.get('name'),
				url: this.get('url'),
				type: this.get('type'),
				subType: this.get('sub_type'),
				version: this.get('version'),
				description: this.get('description'),
				keywords: this.get('keywords'),
				support: {
					status: this.get('support_status'),
					email: this.get('support_email'),
					channel: Version.parseSlackChannel(this.get('support_channel')),
					isOrigami: this.get('support_is_origami')
				},
				resources: this.get('resource_urls'),
				lastIngested: this.get('updated_at')
			};
		},

		// Serialize the version as if it represented a repository
		serializeAsRepo() {
			const repo = this.serialize();

			// Switch the IDs
			repo.id = this.get('repo_id');

			// Switch the resource URLs
			repo.resources.self = repo.resources.repo;
			delete repo.resources.repo;

			return repo;
		},

		// Model virtual methods
		outputVirtuals: false,
		virtuals: {

			// Get whether the repo is supported by the Origami team
			support_is_origami() {
				return (this.get('support_email') === origamiSupportEmail);
			},

			// Get the support Slack channel name
			support_channel_name() {
				const parsedSlackChannel = Version.parseSlackChannel(this.get('support_channel'));
				return (parsedSlackChannel ? parsedSlackChannel.name : null);
			},

			// Get the support Slack channel URL
			support_channel_url() {
				const parsedSlackChannel = Version.parseSlackChannel(this.get('support_channel'));
				return (parsedSlackChannel ? parsedSlackChannel.url : null);
			},

			// Get a description of the version, falling back through different manifests
			description() {
				const manifests = this.get('manifests') || {};

				// Order: origami, about, package, bower
				if (manifests.origami && manifests.origami.description && typeof manifests.origami.description === 'string') {
					return manifests.origami.description;
				}
				if (manifests.about && manifests.about.description && typeof manifests.about.description === 'string') {
					return manifests.about.description;
				}
				if (manifests.package && manifests.package.description && typeof manifests.package.description === 'string') {
					return manifests.package.description;
				}
				if (manifests.bower && manifests.bower.description && typeof manifests.bower.description === 'string') {
					return manifests.bower.description;
				}
				return null;
			},

			// Get keywords for the version, falling back through different manifests
			keywords() {
				const manifests = this.get('manifests') || {};
				let keywords = [];

				// Order: origami, package, bower
				if (manifests.origami) {
					keywords = union(keywords, extractKeywords(manifests.origami));
				}
				if (manifests.package) {
					keywords = union(keywords, extractKeywords(manifests.package));
				}
				if (manifests.bower) {
					keywords = union(keywords, extractKeywords(manifests.bower));
				}

				return keywords
					.filter(keyword => typeof keyword === 'string')
					.map(keyword => keyword.trim().toLowerCase());
			},

			// Get the Origami sub-type (category) for the version
			sub_type() {
				const manifests = this.get('manifests') || {};
				if (manifests.origami && manifests.origami.origamiCategory && typeof manifests.origami.origamiCategory === 'string') {
					return manifests.origami.origamiCategory;
				}
				return null;
			},

			// Get helper resource URLs for the version
			resource_urls() {
				const urls = {
					self: `/v1/repos/${this.get('repo_id')}/versions/${this.get('id')}`,
					repo: `/v1/repos/${this.get('repo_id')}`,
					versions: `/v1/repos/${this.get('repo_id')}/versions`,
					manifests: {},
					markdown: {}
				};
				for (const [name, value] of Object.entries(this.get('manifests') || {})) {
					urls.manifests[name] = (value ? `${urls.self}/manifests/${name}` : null);
				}
				for (const [name, value] of Object.entries(this.get('markdown') || {})) {
					urls.markdown[name] = (value ? `${urls.self}/markdown/${name}` : null);
				}
				return urls;
			}

		}

	// Model static methods
	}, {

		// Fetch the latest version of every repo
		fetchLatest() {
			return Version.collection().query(qb => {
				qb.distinct(app.database.knex.raw('ON (name) name'));
				qb.select('*');
				qb.orderBy('name');
				qb.orderBy('created_at', 'desc');
			}).fetch();
		},

		// Fetch the latest versions of a repo with a given repo ID
		fetchLatestByRepoId(repoId) {
			return Version.collection().query(qb => {
				qb.select('*');
				qb.where('repo_id', repoId);
				qb.orderBy('created_at', 'desc');
			}).fetchOne();
		},

		// Fetch the latest versions of a repo with a given repo name
		fetchLatestByRepoName(repoName) {
			return Version.collection().query(qb => {
				qb.select('*');
				qb.where('name', repoName);
				qb.orderBy('created_at', 'desc');
			}).fetchOne();
		},

		// Fetch all versions of a repo with a given repo ID
		fetchByRepoId(repoId) {
			return Version.collection().query(qb => {
				qb.select('*');
				qb.where('repo_id', repoId);
				qb.orderBy('created_at', 'desc');
			}).fetch();
		},

		// Fetch a version with a given repo ID and version ID
		fetchByRepoIdAndVersionId(repoId, versionId) {
			return Version.collection().query(qb => {
				qb.select('*');
				qb.where('repo_id', repoId);
				qb.where('id', versionId);
			}).fetchOne();
		},

		// Fetch a versions with a given repo ID and semver version number
		fetchByRepoIdAndVersionNumber(repoId, versionNumber) {
			return Version.collection().query(qb => {
				qb.select('*');
				qb.where('repo_id', repoId);
				qb.where('version', Version.normaliseSemver(versionNumber));
			}).fetchOne();
		},

		// Fetch a version with a given url and tag
		fetchOneByUrlAndTag(url, tag) {
			return Version.collection().query(qb => {
				qb.select('*');
				qb.where('url', url);
				qb.where('tag', tag);
			}).fetchOne();
		},

		// Normalise a semver version
		normaliseSemver(semverVersion) {
			return semver.valid(semverVersion);
		},

		// Create a version based on an Ingestion
		async createFromIngestion(ingestion) {
			try {
				const url = ingestion.get('url');
				const tag = ingestion.get('tag');

				// Expect a valid GitHub URL
				if (!app.github.isValidUrl(url)) {
					throw app.github.error('Ingestion URL is not a GitHub repository', false);
				}
				const {owner, repo} = app.github.extractRepoFromUrl(url);

				// Check that the repo/tag exist
				const repoTagExists = await app.github.isValidRepoAndTag({owner, repo, tag});
				if (!repoTagExists) {
					throw app.github.error('Repo or tag does not exist', false);
				}

				// Load the Origami manifest first
				const origamiManifest = await app.github.loadJsonFile({
					path: 'origami.json',
					ref: tag,
					owner,
					repo
				});
				if (!origamiManifest) {
					throw app.github.error('Repo does not contain an Origami manifest', false);
				}

				// Extract the information we need from the Origami manifest
				const origamiManifestNormalised = Version.normaliseOrigamiManifest(origamiManifest);

				// Load the other manifests
				const [aboutManifest, bowerManifest, imageSetManifest, packageManifest] = await Promise.all([
					app.github.loadJsonFile({
						path: 'about.json',
						ref: tag,
						owner,
						repo
					}),
					app.github.loadJsonFile({
						path: 'bower.json',
						ref: tag,
						owner,
						repo
					}),
					app.github.loadJsonFile({
						path: 'imageset.json',
						ref: tag,
						owner,
						repo
					}),
					app.github.loadJsonFile({
						path: 'package.json',
						ref: tag,
						owner,
						repo
					})
				]);

				// Load repo markdown
				const readme = await app.github.loadReadme({
					ref: tag,
					owner,
					repo
				});
				const designguidelines = await app.github.loadFile({
					path: 'designguidelines.md',
					ref: tag,
					owner,
					repo
				});

				// Create and return a new version
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
						designguidelines
					}
				});
				await version.save();
				return version;

			} catch (error) {
				// Assume errors are recoverable by default
				if (error.isRecoverable !== false) {
					error.isRecoverable = true;
				}
				throw error;
			}

		},

		// Normalise an Origami manifest file. Because we use the manifest
		// to create fields in the database, we need to ensure that it
		// mostly conforms to the Origami spec.
		normaliseOrigamiManifest(manifest) {
			const normalisedManifest = cloneDeep(manifest);

			// Ensure that origamiType is a string or null
			if (typeof normalisedManifest.origamiType !== 'string') {
				normalisedManifest.origamiType = null;
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
				normalisedManifest.supportContact.slack = 'financialtimes/ft-origami';
			}

			return normalisedManifest;
		},

		// Parse an origami.json Slack channel value
		parseSlackChannel(slack) {
			if (!slack) {
				return null;
			}
			const [ , , slackOrg = 'financialtimes', , channelName] = slack.trim().match(/^(([^\/]+)(\/))?\#?(.+)$/i);
			return {
				name: `#${channelName}`,
				url: `https://${slackOrg}.slack.com/messages/${channelName}`
			};
		}

	});

	// Add the model to the app
	app.model.Version = Version;

}

// Extract keywords from a manifest file
function extractKeywords(manifest) {
	if (typeof manifest.keywords === 'string') {
		return manifest.keywords.trim().split(/[,\s]+/);
	}
	if (Array.isArray(manifest.keywords)) {
		return manifest.keywords;
	}
	return [];
}
