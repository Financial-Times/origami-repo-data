'use strict';

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
				this.attributes.key = uuid();
				this.attributes.createdAt = new Date();
			});

			// When a model is saved...
			this.on('saving', () => {
				// Fill out automatic fields
				this.attributes.updatedAt = new Date();
				return this;
			});

		},

		// Override default serialization so we can control
		// what's output
		serialize() {
			return {
				id: this.get('id'),
				name: this.get('name'),
				key: this.get('key'),
				permissions: {
					read: this.get('read'),
					write: this.get('write'),
					admin: this.get('admin')
				},
				lastUsed: this.get('last_used_at')
			};
		},

	// Model static methods
	}, {

		// Fetch a key by its key property
		fetchByKey(key) {
			return Key.collection().query(qb => {
				qb.where('key', key);
				qb.orderBy('created_at', 'desc');
			}).fetchOne();
		}

	});

	// Add the model to the app
	app.model.Key = Key;

}
