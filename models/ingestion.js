'use strict';

const joi = require('joi').extend(require('joi-extension-semver'));
const uuid = require('uuid/v4');

module.exports = initModel;

function initModel(app) {

	// Model validation schema
	const schema = joi.object().keys({
		url: joi.string().uri({
			scheme: 'https'
		}).required(),
		tag: joi.semver().valid().required(),
		ingestion_attempts: joi.number().integer(),
		ingestion_started_at: joi.date()
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
			return new Promise((resolve, reject) => {
				joi.validate(this.attributes, schema, {
					abortEarly: false,
					allowUnknown: true
				}, (error) => {
					if (error) {
						return reject(error);
					}
					resolve();
				});
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
		}

	});

	// Add the model to the app
	app.model.Ingestion = Ingestion;

}
