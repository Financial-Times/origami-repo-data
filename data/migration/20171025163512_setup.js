'use strict';

exports.up = async (database, Promise) => {

	// Create the repos table
	await database.schema.createTable('repos', table => {

		// Meta information
		table.string('id').unique().primary();
		table.timestamp('createdAt').defaultTo(database.fn.now());
		table.timestamp('updatedAt').defaultTo(database.fn.now());

		// Actual repo data
		table.string('name').notNullable();
		table.string('type').defaultTo(null);
		table.string('url').notNullable();
		table.string('supportEmail');
		table.string('supportChannel');

	});

	// Create the versions table
	await database.schema.createTable('versions', table => {

		// Meta information
		table.string('id').unique().primary();
		table.timestamp('createdAt').defaultTo(database.fn.now());
		table.timestamp('updatedAt').defaultTo(database.fn.now());
		table.string('repo').notNullable();

		// Actual version data
		table.string('number').notNullable();
		table.string('commitHash').notNullable();

		table.json('origamiManifest');
		table.json('bowerManifest');
		table.json('imagesetManifest');
		table.json('aboutManifest');
		table.json('packageManifest');

		table.json('markdownDocuments');

		// Foreign key contraints
		table.foreign('repo').references('repos.id');

	});

};

exports.down = async (database, Promise) => {
	await database.schema.dropTable('versions');
	await database.schema.dropTable('repos');
};
