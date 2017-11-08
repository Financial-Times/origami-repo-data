'use strict';

exports.up = async database => {

	// Create the ingestion_queue table
	await database.schema.createTable('ingestion_queue', table => {

		// Meta information
		table.string('id').unique().primary();
		table.timestamp('created_at').defaultTo(database.fn.now());
		table.timestamp('updated_at').defaultTo(database.fn.now());

		// Repo/release information
		table.string('url').notNullable();
		table.string('tag').notNullable();

		// Ingestion progress data
		table.integer('ingestion_attempts').notNullable().defaultTo(0);
		table.timestamp('ingestion_started_at').defaultTo(null);

	});

};

exports.down = async database => {
	await database.schema.dropTable('ingestion_queue');
};
