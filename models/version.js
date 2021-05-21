'use strict';

const isPlainObject = require('lodash/isPlainObject');
const semver = require('semver');
const {removeStopwords} = require('stopword');
const { v4: uuid, v5: uuidv5 } = require('uuid');
const union = require('lodash/union');
const propertyFilter = require('../lib/model-property-filter');
const createVersionFromIngestion = require('../lib/create-version-from-ingestion');

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

				const prerelease = semver.prerelease(this.attributes.version);
				this.attributes.version_major = semver.major(this.attributes.version);
				this.attributes.version_minor = semver.minor(this.attributes.version);
				this.attributes.version_patch = semver.patch(this.attributes.version);
				this.attributes.version_prerelease = (prerelease ? prerelease.join('.') : prerelease);

				this.attributes.updated_at = new Date();
				return this;
			});

		},

		// Override default serialization so we can control
		// what's output
		serialize() {
			return {
				id: this.get('id'),
				repo: this.get('repo_id'),
				name: this.get('name'),
				url: this.get('url'),
				type: this.get('type'),
				subType: this.get('sub_type'),
				version: this.get('version'),
				versionTag: this.get('tag'),
				origamiVersion: this.get('origami_version'),
				imageSetScheme: this.get('imageset_scheme'),
				description: this.get('description'),
				brands: this.get('brands'),
				keywords: this.get('keywords'),
				inferredKeywords: this.get('inferred_keywords'),
				languages: this.get('languages'),
				support: {
					status: this.get('support_status'),
					email: this.get('support_email'),
					channel: Version.parseSlackChannel(this.get('support_channel')),
					isOrigami: this.get('support_is_origami'),
					isPrerelease: this.get('support_is_prerelease')
				},
				resources: this.get('resource_urls'),
				supportingUrls: this.get('supporting_urls'),
				lastIngested: this.get('updated_at')
			};
		},

		// Serialize the version as if it represented a repository
		serializeAsRepo() {
			const repo = this.serialize();

			// Switch the IDs
			repo.id = repo.repo;
			delete repo.repo;

			// Switch the resource URLs
			repo.resources.self = repo.resources.repo;
			delete repo.resources.repo;

			return repo;
		},

		// Get the demo details for this version
		demos(filter) {
			const manifests = this.get('manifests') || {};
			if (manifests.origami && manifests.origami.demos && Array.isArray(manifests.origami.demos)) {
				const demos = manifests.origami.demos
					.filter(demo => demo && !demo.hidden)
					.map(demo => Version.normaliseOrigamiDemo(this, demo, filter))
					.filter(demo => Boolean(demo) && Boolean(demo.display.live));
				return (demos.length ? demos : null);
			}
			return null;
		},

		// Get the images for this version
		images(sourceParameter = 'origami-repo-data') {
			const manifests = this.get('manifests') || {};
			if (this.get('type') === 'imageset' && manifests.imageSet && manifests.imageSet.images && Array.isArray(manifests.imageSet.images)) {
				const scheme = manifests.imageSet.scheme || null;
				const majorVersion = this.get('version_major');
				return manifests.imageSet.images
					.filter(isPlainObject)
					.map(image => {
						const name = `${image.name}` || null;
						const url = `https://www.ft.com/__origami/service/image/v2/images/raw/${scheme}-v${majorVersion}:${name}?source=${sourceParameter}`;
						return {
							title: `${image.name}` || null,
							supportingUrls: {
								full: url,
								w200: `${url}&width=200`
							}
						};
					});
			}
			return null;
		},

		// Get the dependencies for this version
		dependencies() {
			const manifests = this.get('manifests') || {};
			const manifestsWithDependencies = ['bower', 'package']
				.filter(name => manifests[name])
				.map(name => {
					return {
						name,
						data: manifests[name]
					};
				});
			const dependencyKeys = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
			const dependencies = [];

			// If the repo has either a bower or package manifest...
			if (manifestsWithDependencies.length) {
				for (const manifest of manifestsWithDependencies) {
					for (const dependencyKey of dependencyKeys) {
						if (manifest.data[dependencyKey]) {
							for (const [name, version] of Object.entries(manifest.data[dependencyKey])) {
								dependencies.push({
									name,
									version,
									source: (manifest.name === 'bower' ? 'bower' : 'npm'),
									isDev: (dependencyKey === 'devDependencies'),
									isPeer: (dependencyKey === 'peerDependencies'),
									isOptional: (dependencyKey === 'optionalDependencies')
								});
							}
						}
					}
				}
				return dependencies;
			}

			return null;
		},

		// Model virtual methods
		outputVirtuals: false,
		virtuals: {

			// Get whether the repo is a component. Either "module" or
			// "component" could be used interchangeably for spec v1 components.
			// It was normalised to "module" within repo data, however, spec v2
			// components dropped the "module" type for "component",
			type_is_component() {
				return ['module', 'component'].includes(
					this.get('type')
				);
			},

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

			// Get whether the repo is a prerelease
			support_is_prerelease() {
				return (this.get('version_prerelease') !== null);
			},

			// Get the imageset scheme if the repo is an image-set
			imageset_scheme() {
				const manifests = this.get('manifests') || {};
				if (manifests.imageSet && manifests.imageSet.scheme && typeof manifests.imageSet.scheme === 'string') {
					return `${manifests.imageSet.scheme}-v${this.get('version_major')}`;
				}
				return null;
			},

			// Get the normalised name of a repo for sorting (stripping out "o-" prefixes and lower-casing)
			name_sortable() {
				return this.get('name').toLowerCase().replace(/^[a-z]\-/, '');
			},


			// Get the npm package name
			package_name() {
				const manifests = this.get('manifests') || {};
				const packageManifest = manifests.package || {};
				const packageName = packageManifest.name;
				return packageName || null;
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

			// Get brands for the version.
			brands() {
				const manifests = this.get('manifests') || {};
				const type = this.get('type');
				const brands = (manifests.origami && manifests.origami.brands ? manifests.origami.brands : []);
				return Version.normaliseOrigamiBrandsArray(type, brands);
			},

			// Get the component's Origami Specification version
			origami_version() {
				const manifests = this.get('manifests') || {};
				// Handle Origami spec v1 and v2 projects
				const origamiVersion = manifests?.origami?.origamiVersion || manifests?.origami?.origami;
				return origamiVersion ? `${origamiVersion}` : '';
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

			// Get inferred keywords
			inferred_keywords() {
				const sources = [this.get('description')];
				const demos = this.demos();
				const definedKeywords = this.get('keywords');
				if (demos) {
					for (const demo of demos) {
						if (demo.title && demo.title !== demo.id) {
							sources.push(demo.title);
						}
					}
				}
				const words = sources
					.filter(source => source && typeof source === 'string')
					.reduce((words, source) => {
						return words.concat(source.toLowerCase().split(/[^a-z0-9\-_]+/));
					}, [])
					.filter(word => (word && word.length >= 3 && !definedKeywords.includes(word)));
				const dedupedWords = Array.from(new Set(words));
				return removeStopwords(dedupedWords).sort();
			},

			// Get the Origami sub-type (category) for the version
			// Spec v1 components/modules have a sub-type (category),
			// this was dropped in spec v2:
			// https://github.com/Financial-Times/origami/pull/120
			sub_type() {
				const manifests = this.get('manifests') || {};
				if (manifests.origami && manifests.origami.origamiCategory && typeof manifests.origami.origamiCategory === 'string') {
					return manifests.origami.origamiCategory;
				}
				return null;
			},

			// Get helper resource URLs for the version
			resource_urls() {
				const repoId = this.get('repo_id');
				const versionId = this.get('id');
				const urls = {
					self: `/v1/repos/${repoId}/versions/${versionId}`,
					repo: `/v1/repos/${repoId}`,
					versions: `/v1/repos/${repoId}/versions`,
					manifests: {},
					markdown: {},
					demos: (this.demos() ? `/v1/repos/${repoId}/versions/${versionId}/demos` : null),
					images: (this.images() ? `/v1/repos/${repoId}/versions/${versionId}/images` : null),
					dependencies: (this.dependencies() ? `/v1/repos/${repoId}/versions/${versionId}/dependencies` : null)
				};
				for (const [name, value] of Object.entries(this.get('manifests') || {})) {
					urls.manifests[name] = (value ? `${urls.self}/manifests/${name}` : null);
				}
				for (const [name, value] of Object.entries(this.get('markdown') || {})) {
					urls.markdown[name] = (value ? `${urls.self}/markdown/${name}` : null);
				}
				return urls;
			},

			// Get supporting URLs for the version
			supporting_urls() {
				return {
					ci: this.get('ci_url'),
					issues: this.get('issues_url'),
					service: this.get('service_url')
				};
			},

			// Get the continuous integration URL for the version
			ci_url() {

				// Default to the value in origami.json
				const manifests = this.get('manifests') || {};
				if (manifests.origami && manifests.origami.ci) {
					if (typeof manifests.origami.ci.circle === 'string') {
						return manifests.origami.ci.circle;
					}
					if (typeof manifests.origami.ci.travis === 'string') {
						return manifests.origami.ci.travis;
					}
					if (typeof manifests.origami.ci.jenkins === 'string') {
						return manifests.origami.ci.jenkins;
					}
				}

				// Check the README for a matching CI URL
				const markdown = this.get('markdown') || {};
				if (markdown.readme) {
					const {owner, repo} = app.github.extractRepoFromUrl(this.get('url'));
					const circleRegExp = new RegExp(`https?://(www\\.)?circleci.com/gh/${owner}/${repo}`, 'i');
					const travisRegExp = new RegExp(`https?://(www\\.)?travis-ci.(com|org)/${owner}/${repo}`, 'i');

					if (circleRegExp.test(markdown.readme)) {
						return `https://circleci.com/gh/${owner}/${repo}`;
					}
					if (travisRegExp.test(markdown.readme)) {
						return `https://travis-ci.org/${owner}/${repo}`;
					}
				}

				return null;
			},

			// Get the GitHub issues URL for the version
			issues_url() {
				const {owner, repo} = app.github.extractRepoFromUrl(this.get('url'));
				return `https://github.com/${owner}/${repo}/issues`;
			},

			// Get the service URL for the version
			service_url() {
				const manifests = this.get('manifests') || {};
				if (this.get('type') === 'service' && manifests.about && typeof manifests.about.primaryUrl === 'string') {
					return manifests.about.primaryUrl;
				}
				return null;
			}

		}

	// Model static methods
	}, {

		// Fetch the single latest version of every repo
		async fetchRepos() {
			const repos = await Version.collection().query(qb => {
				qb.distinct(app.database.knex.raw('ON (name) name'));
				qb.select('*');

				// We exclude any versions with a prerelease so that
				// the repository's latest version is considered the
				// most recent *stable* version
				qb.whereNull('version_prerelease');

				// The order here is important, as we select *distinct* versions
				// by name, we need the first result to be the one with the
				// highest version number; https://semver.org/ specifies that
				// version numbers should be sorted major, minor, patch, prerelease
				// returning the latest handles cases of re-tagging, where the same
				// semver version has been used against a new tag e.g. 1.0.0 to v1.0.0
				qb.orderBy('name');
				qb.orderBy('version_major', 'desc');
				qb.orderBy('version_minor', 'desc');
				qb.orderBy('version_patch', 'desc');
				qb.orderBy('version_prerelease', 'desc');
				qb.orderBy('created_at', 'desc');

			}).fetch();

			// We sort again here so that we can do so on a virtual normalised name
			return repos.sortBy('name_sortable');
		},

		// Fetch the single latest version of every repo with filters
		async fetchFilteredRepos(filters) {

			// Create a regular expression for the search
			let search;
			if (filters.search && typeof filters.search === 'string') {
				const regExpQuery = filters.search.trim()
				  // backslash escape special regular expression characters
				  .replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
				  // replace spaces with dot-star, for fuzzy searching
				  .replace(/\s+/g, '.*');
				const searchRegExp = new RegExp(`${regExpQuery}`, 'i');
				search = searchRegExp.test.bind(searchRegExp);
			}

			return (await this.fetchRepos())
				.filter(propertyFilter('brands', filters.brand))
				.filter(propertyFilter('type', filters.type))
				.filter(propertyFilter('support_email', filters.supportEmail))
				.filter(propertyFilter('support_status', filters.status))
				.filter(repo => {
					const standardMatch = propertyFilter('origami_version', filters.origamiVersion);

					if (standardMatch(repo)) {
						return true;
					}

					if (filters.origamiVersion.match(/\d+/)) {
						const repoOrigamiVersion = repo.get('origami_version');
						if (!repoOrigamiVersion) {
							return false;
						}
						const major = repoOrigamiVersion.split('.')[0];
						if (major === filters.origamiVersion) {
							return true;
						}
					}

					return false;
				})
				.filter(repo => {
					repo.searchScore = 0;
					if (!search) {
						return true;
					}

					// If the search matches the repo name, score highly
					if (search(repo.get('name'))) {
						repo.searchScore += 10;
					}

					// For each matched explicit keyword, score medium
					repo.searchScore += repo.get('keywords')
						.filter(keyword => search(keyword))
						.length * 2;

					// For each matched inferred keyword, score low
					repo.searchScore += repo.get('inferred_keywords')
						.filter(keyword => search(keyword))
						.length;

					return (repo.searchScore !== 0);
				})
				.sort((a, b) => {

					// First sort by search score
					if (a.searchScore > b.searchScore) {
						return -1;
					}
					if (b.searchScore > a.searchScore) {
						return 1;
					}

					// Fall back to sorting by normalised name if search score is equal
					if (a.get('name_sortable') > b.get('name_sortable')) {
						return 1;
					}
					if (b.get('name_sortable') > a.get('name_sortable')) {
						return -1;
					}
					return 0;
				});
		},

		// Fetch the latest versions of a repo with a given repo ID
		fetchLatestByRepoId(repoId) {
			return Version.collection().query(qb => {
				qb.select('*');
				qb.where('repo_id', repoId);
				qb.orderBy('version_major', 'desc');
				qb.orderBy('version_minor', 'desc');
				qb.orderBy('version_patch', 'desc');
				qb.orderBy('version_prerelease', 'desc');
				qb.orderBy('created_at', 'desc');
			}).fetchOne();
		},

		// Fetch the latest versions of a repo with a given repo name
		fetchLatestByRepoName(repoName) {
			return Version.collection().query(qb => {
				qb.select('*');
				qb.where('name', repoName);
				qb.orderBy('version_major', 'desc');
				qb.orderBy('version_minor', 'desc');
				qb.orderBy('version_patch', 'desc');
				qb.orderBy('version_prerelease', 'desc');
				qb.orderBy('created_at', 'desc');
			}).fetchOne();
		},

		// Fetch all versions of a repo with a given repo ID
		fetchByRepoId(repoId) {
			return Version.collection().query(qb => {
				qb.select('*');
				qb.where('repo_id', repoId);
				qb.orderBy('version_major', 'desc');
				qb.orderBy('version_minor', 'desc');
				qb.orderBy('version_patch', 'desc');
				qb.orderBy('version_prerelease', 'desc');
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
				qb.orderBy('created_at', 'desc');
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
			return await createVersionFromIngestion(ingestion, app.model.Version, app.github);
		},

		// Normalise an Origami manifest demo
		normaliseOrigamiDemo(version, demo, filter = {}) {
			if (!isPlainObject(demo)) {
				return null;
			}
			if (!demo.name || typeof demo.name !== 'string') {
				return null;
			}
			// The title is required according to the spec but some components do not currently conform.
			// http://origami.ft.com/docs/syntax/origamijson/#format
			if (demo.title && typeof demo.title !== 'string') {
				return null;
			}
			if (demo.description && typeof demo.description !== 'string') {
				return null;
			}

			// Work out visibility based on brands
			const display = {
				live: true,
				html: (demo.display_html !== false)
			};
			// Filter based on brand if the filter is present
			const demoBrands = Version.normaliseOrigamiBrandsArray(version.get('type'), demo.brands);
			if (filter && filter.brand && Array.isArray(demoBrands) && demoBrands.length) {
				if (!demoBrands.includes(filter.brand)) {
					display.live = display.html = false;
				}
			}

			// Calculate the live demo URL (including brand if necessary)
			const origamiVersion = version.get('origami_version');
			let liveDemoUrl;
			let htmlDemoUrl;
			if (!origamiVersion || origamiVersion === '1') {
				liveDemoUrl = new URL(`https://www.ft.com/__origami/service/build/v2/demos/${version.get('name')}@${version.get('version')}/${demo.name}`);
				htmlDemoUrl = new URL(`${liveDemoUrl.toString()}/html`);
			} else {
				liveDemoUrl = new URL('https://www.ft.com/__origami/service/build/v3/demo');
				liveDemoUrl.searchParams.append('component', `${version.get('name')}@${version.get('version')}`);
				liveDemoUrl.searchParams.append('demo', demo.name);
				liveDemoUrl.searchParams.append('system_code', 'origami-repo-data');

				htmlDemoUrl = new URL('https://www.ft.com/__origami/service/build/v3/demo/html');
				htmlDemoUrl.searchParams.append('component', `${version.get('name')}@${version.get('version')}`);
				htmlDemoUrl.searchParams.append('demo', demo.name);
				htmlDemoUrl.searchParams.append('system_code', 'origami-repo-data');
			}

			// @breaking require a brand filter in a future version of
			// repo-data rather than default to the master brand, as the build
			// service url returned requires a brand parameter since v3
			const demoBrand = filter && filter.brand ? filter.brand : 'master';
			liveDemoUrl.searchParams.append('brand', demoBrand);
			htmlDemoUrl.searchParams.append('brand', demoBrand);

			return {
				id: demo.name,
				title: demo.title || demo.name,
				description: demo.description || null,
				supportingUrls: {
					live: liveDemoUrl,
					html: (demo.display_html !== false ? htmlDemoUrl : null)
				},
				display
			};
		},

		// Normalise an origami brands array
		normaliseOrigamiBrandsArray(type, brands) {
			if (type !== 'module' && type !== 'component') {
				return null;
			}
			if (!Array.isArray(brands)) {
				return [];
			}
			return brands
				.filter(brand => typeof brand === 'string')
				.map(brand => brand.trim().toLowerCase());
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
	if (typeof manifest.keywords === 'string' && manifest.keywords.length) {
		return manifest.keywords.trim().split(/[,\s]+/);
	}
	if (Array.isArray(manifest.keywords)) {
		return manifest.keywords;
	}
	return [];
}
