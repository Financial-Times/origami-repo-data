'use strict';

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const uuid = require('uuid/v4');

module.exports = initModel;

function initModel(app) {

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
				description: this.get('description'),
				permissions: {
					read: this.get('read'),
					write: this.get('write'),
					admin: this.get('admin')
				}
			};
		},

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

		// Fetch a key by its key property
		fetchById(keyId) {
			return Key.collection().query(qb => {
				qb.where('id', keyId);
				qb.orderBy('created_at', 'desc');
			}).fetchOne();
		}

	});

	// Add the model to the app
	app.model.Key = Key;

}
