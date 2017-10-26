'use strict';

const uuid = require('uuid/v4');

module.exports = initModel;

function initModel(app) {

	// Model prototypal methods
	const Repo = app.database.Model.extend({
		tableName: 'repos',

		// Model initialization
		initialize() {

			// When a model is created...
			this.on('creating', () => {
				// Fill out automatic fields
				this.attributes.id = uuid();
				this.attributes.createdAt = new Date();
			});

			// When a model is saved...
			this.on('saving', () => {
				// Fill out automatic fields
				this.attributes.updatedAt = new Date();
				return this;
			});

		}

	// Model static methods
	}, {

		// Nothing to see here yet

	});

	// Add the model to the app
	app.model.Repo = Repo;

}
