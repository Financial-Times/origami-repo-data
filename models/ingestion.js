'use strict';

const joi = require('joi').extend(require('joi-extension-semver'));
const { v4: uuid } = require('uuid');

module.exports = initModel;

function initModel(app) {



	// Model validation schema
	const githubSchema = joi.object().keys({
		url: joi.string().uri({
			scheme: 'https'
		}).required(),
		type: joi.string().valid('version', 'bundle'),
		tag: joi.semver().valid().required(),
		ingestion_attempts: joi.number().integer(),
		ingestion_started_at: joi.date().allow(null)
	});

	const npmSchema = joi.object().keys({
		packageName: joi.string().required(),
		type: joi.string().valid('npm'),
		version: joi.semver().valid().required(),
		ingestion_attempts: joi.number().integer(),
		ingestion_started_at: joi.date().allow(null)
	});

	// Model prototypal methods
	const Ingestion = app.database.Model.extend({
		tableName: 'ingestion_queue',

		// Model initialization
		initialize() {

			// When a model is created...
			this.on('creating', () => {
				// Fill out automatic fields
				this.attributes.id = uuid();
				this.attributes.created_at = new Date();
			});

			// When a model is saved...
			this.on('saving', async () => {
				// Fill out automatic fields
				this.attributes.updated_at = new Date();

				// Validate the model
				await this.validateSave();

				return this;
			});

		},

		// Override default serialization so we can control
		// what's output
		serialize() {
			return {
				id: this.get('id'),
				repo: {
					url: this.get('url'),
					tag: this.get('tag'),
				},
				package: {
					packageName: this.get('packageName'),
					version: this.get('version'),
				},
				type: this.get('type'),
				progress: {
					isInProgress: this.get('is_in_progress'),
					startTime: this.get('ingestion_started_at'),
					attempts: this.get('ingestion_attempts')
				},
				created: this.get('created_at'),
				lastUpdated: this.get('updated_at')
			};
		},

		// Validate the model before saving
		validateSave() {
			return new Promise(async (resolve, reject) => {
				try {
					// Validate against the schema
					if (this.attributes.type === 'npm') {
						await joi.validate(this.attributes, npmSchema, {
							abortEarly: false,
							allowUnknown: true
						});
					} else {
						await joi.validate(this.attributes, githubSchema, {
							abortEarly: false,
							allowUnknown: true
						});
					}
				} catch (error) {
					return reject(error);
				}
				if (this.attributes.type === 'npm') {
					// Ensure that ingestion does not conflict with an existing
					// ingestion or version.
					if (this.hasChanged('packageName') || this.hasChanged('version') || this.hasChanged('type')) {
						const ingestionExists = await Ingestion.alreadyExistsNpm(this.attributes.packageName, this.attributes.version, this.attributes.type);
						let conflict = ingestionExists;

						if (!conflict && this.attributes.type === 'version') {
							const version = await app.model.Version.fetchOneByUrlAndTag(this.attributes.url, this.attributes.tag);
							conflict = Boolean(version);
						}

						if (conflict) {
							const error = new Error('Validation failed');
							error.isConflict = true;
							error.name = 'ValidationError';
							error.details = [
								{
									message: 'An ingestion or version with the given packageName and version already exists'
								}
							];
							return reject(error);
						}
					}
				} else {

					// Ensure that ingestion does not conflict with an existing
					// ingestion or version.
					if (this.hasChanged('url') || this.hasChanged('tag') || this.hasChanged('type')) {
						const ingestionExists = await Ingestion.alreadyExists(this.attributes.url, this.attributes.tag, this.attributes.type);
						let conflict = ingestionExists;

						if (!conflict && this.attributes.type === 'version') {
							const version = await app.model.Version.fetchOneByUrlAndTag(this.attributes.url, this.attributes.tag);
							conflict = Boolean(version);
						}

						if (conflict) {
							const error = new Error('Validation failed');
							error.isConflict = true;
							error.name = 'ValidationError';
							error.details = [
								{
									message: 'An ingestion or version with the given URL and tag already exists'
								}
							];
							return reject(error);
						}
					}
				}

				resolve();
			});
		},

		// Model virtual methods
		outputVirtuals: false,
		virtuals: {

			// Get whether the ingestion is currently in-progress
			is_in_progress() {
				return !!this.get('ingestion_started_at');
			}

		}

	// Model static methods
	}, {

		// Check whether an ingestion already exists
		async alreadyExists(url, tag, type) {
			const existingIngestion = await Ingestion.fetchOneByUrlTagAndType(url, tag, type);
			return Boolean(existingIngestion);
		},
		
		async alreadyExistsNpm(packageName, version, type) {
			const existingIngestion = await Ingestion.fetchOneByPackageNameVersionAndType(packageName, version, type);
			return Boolean(existingIngestion);
		},

		// Fetch all ingestions
		fetchAll() {
			return Ingestion.collection().query(qb => {
				qb.orderBy('created_at', 'asc');
			}).fetch();
		},

		// Fetch an ingestion by its ID property
		fetchById(ingestionId) {
			return Ingestion.collection().query(qb => {
				qb.where('id', ingestionId);
			}).fetchOne();
		},

		// Fetch an ingestion with a given url and tag
		fetchOneByUrlTagAndType(url, tag, type) {
			return Ingestion.collection().query(qb => {
				qb.select('*');
				qb.where('url', url);
				qb.where('tag', tag);
				qb.where('type', type);
			}).fetchOne();
		},
		
		fetchOneByPackageNameVersionAndType(packageName, version, type) {
			return Ingestion.collection().query(qb => {
				qb.select('*');
				qb.where('packageName', packageName);
				qb.where('version', version);
				qb.where('type', type);
			}).fetchOne();
		},

		// Fetch the latest ingestion that isn't running,
		// and mark it as running
		async fetchLatestAndMarkAsRunning() {
			// We use transactions here to ensure the update is never triggered twice
			// if multiple dynos are accessing the entry in the database
			return app.database.transaction(async transaction => {
				const ingestion = await Ingestion.collection().query(qb => {

					// The ingestion must not be currently running, and must have
					// fewer attempts than the maximum
					qb.where('ingestion_started_at', null);
					qb.where('ingestion_attempts', '<', Ingestion.maximumAttempts);

					// This is the implementation of the exponential backoff.
					// The ingestion will be attempted at longer and longer
					// intervals (10 seconds time 2 to the power of the number
					// of attempts made so far)
					qb.where(app.database.knex.raw('created_at + (interval \'10 seconds\' * power(2, ingestion_attempts)) <= now()'));

					// Get the oldest ingestion first, so that things hang
					// around for less time
					qb.orderBy('updated_at', 'asc');

					qb.transacting(transaction);
					qb.forUpdate();
				}).fetchOne();
				if (!ingestion) {
					return null;
				}

				// Mark the ingestion as started
				ingestion.set('ingestion_started_at', new Date());
				await ingestion.save(null, {
					transacting: transaction
				});
				return ingestion;
			});
		},

		// Fetch all ingestions that have been attempted too many times
		async fetchOverAttempted() {
			return Ingestion.collection().query(qb => {
				qb.select('*');
				qb.where('ingestion_attempts', '>=', Ingestion.maximumAttempts);
			}).fetch();
		},

		// Fetch all ingestions that have been running for too long
		async fetchOverRunning() {
			return Ingestion.collection().query(qb => {
				qb.select('*');
				qb.where(app.database.knex.raw(`ingestion_started_at + (interval '${Ingestion.maximumRunTime}') <= now()`));
			}).fetch();
		},

		// Create a new ingestion
		async create(url, tag, type) {
			const ingestion = await new Ingestion({ url, tag, type });
			return ingestion;
		}
	});

	// The maximum number of attempts to make on
	// an ingestion
	Ingestion.maximumAttempts = 10;

	// The maximum run time of an ingestion. This
	// is used in a query and so must be a valid
	// PostgreSQL interval
	Ingestion.maximumRunTime = '15 minutes';

	// Add the model to the app
	app.model.Ingestion = Ingestion;

}
