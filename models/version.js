'use strict';

const uuid = require('uuid/v4');
const uuidv5 = require('uuid/v5');

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
				version: this.get('version'),
				commitHash: this.get('commit_hash'),
				description: this.get('description'),
				keywords: this.get('keywords'),
				support: {
					email: this.get('support_email'),
					channel: this.get('support_channel'),
					isOrigami: this.get('support_is_origami')
				},
				lastUpdated: this.get('updated_at')
			};
			// TODO more data should be exposed
		},

		// Serialize the version as if it represented a repository
		serializeAsRepo() {
			const repo = this.serialize();

			// Switch the IDs
			repo.id = this.get('repo_id');

			delete repo.commitHash;
			return repo;
		},

		// Model virtual methods
		outputVirtuals: false,
		virtuals: {

			// Get whether the repo is supported by the Origami team
			support_is_origami() {
				return (this.get('support_email') === 'origami.support@ft.com');
			},

			// Get a description of the version, falling back through different manifests
			description() {
				const manifests = this.get('manifests');

				// Order: origami, about, package, bower
				if (manifests.origami && manifests.origami.description) {
					return manifests.origami.description;
				}
				if (manifests.about && manifests.about.description) {
					return manifests.about.description;
				}
				if (manifests.package && manifests.package.description) {
					return manifests.package.description;
				}
				if (manifests.bower && manifests.bower.description) {
					return manifests.bower.description;
				}
				return null;
			},

			// Get keywords for the version, falling back through different manifests
			keywords() {
				const manifests = this.get('manifests');
				let keywords;

				// Order: origami, package, bower
				if (manifests.origami && manifests.origami.keywords) {
					keywords = manifests.origami.keywords;
				} else if (manifests.package && manifests.package.keywords) {
					keywords = manifests.package.keywords;
				} else if (manifests.bower && manifests.bower.keywords) {
					keywords = manifests.bower.description;
				}

				if (typeof keywords === 'string') {
					return keywords.split(',').map(keyword => keyword.trim());
				}
				return keywords;
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

		// Fetch all versions of a repo with a given repo ID
		fetchByRepoId(repoId) {
			return Version.collection().query(qb => {
				qb.select('*');
				qb.where('repo_id', repoId);
				qb.orderBy('created_at', 'desc');
			}).fetch();
		},

		// Fetch a versions with a given repo ID and version ID
		fetchByRepoIdAndVersionId(repoId, versionId) {
			return Version.collection().query(qb => {
				qb.select('*');
				qb.where('repo_id', repoId);
				qb.where('id', versionId);
			}).fetchOne();
		}

	});

	// Add the model to the app
	app.model.Version = Version;

}
