'use strict';

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const joi = require('joi');
const uuid = require('uuid/v4');

module.exports = initModel;

function initModel(app) {

	// Model validation schema
	const schema = joi.object().keys({
		secret: joi.string().min(10).required(),
		description: joi.string().required(),
		read: joi.boolean(),
		write: joi.boolean(),
		admin: joi.boolean()
	});

	// Model prototypal methods
	const Key = app.database.Model.extend({
		tableName: 'keys',

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

				// Hash the secret if it's changed
				if (this.hasChanged('secret')) {
					this.attributes.secret = await Key.hash(this.attributes.secret);
				}
				return this;

			});

		},

		// Override default serialization so we can control
		// what's output
		serialize() {
			return {
				id: this.get('id'),
				generated: this.get('created_at'),
				description: this.get('description'),
				permissions: {
					read: this.get('read'),
					write: this.get('write'),
					admin: this.get('admin')
				}
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
		}

	// Model static methods
	}, {

		// Hash a key
		hash(key) {
			const saltRounds = 5;
			return bcrypt.hash(key, saltRounds);
		},

		// Check a key against a hashed key
		compare(key, hash) {
			return bcrypt.compare(key, hash);
		},

		// Generate a secure secret key
		generateSecret() {
			// See https://stackoverflow.com/a/14869745 for the thinking on this
			return crypto.randomBytes(20).toString('hex');
		},

		// Fetch all keys
		fetchAll() {
			return Key.collection().query(qb => {
				qb.orderBy('created_at', 'desc');
			}).fetch();
		},

		// Fetch a key by its key property
		fetchById(keyId) {
			return Key.collection().query(qb => {
				qb.where('id', keyId);
			}).fetchOne();
		}

	});

	// Add the model to the app
	app.model.Key = Key;

}
