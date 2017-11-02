'use strict';

exports.up = async database => {

	// Create the versions table
	await database.schema.createTable('versions', table => {

		// Meta information
		table.string('id').unique().primary();
		table.timestamp('created_at').defaultTo(database.fn.now());
		table.timestamp('updated_at').defaultTo(database.fn.now());

		// Repo information
		table.string('name').notNullable();
		table.string('type').defaultTo(null);
		table.string('url').notNullable();
		table.string('support_email');
		table.string('support_channel');

		// Version information
		table.string('version').notNullable();
		table.string('commit_hash').notNullable();

		// Raw data from manifests and markdown
		table.json('manifests');
		table.json('markdown');

	});

};

exports.down = async database => {
	await database.schema.dropTable('versions');
};
