'use strict';

exports.up = async database => {

	// Create the keys table
	await database.schema.createTable('keys', table => {

		// Meta information
		table.string('id').unique().primary();
		table.timestamp('created_at').defaultTo(database.fn.now());
		table.timestamp('updated_at').defaultTo(database.fn.now());

		// Key information
		table.string('secret').notNullable();
		table.string('description').notNullable();
		table.boolean('read').defaultTo(true);
		table.boolean('write').defaultTo(false);
		table.boolean('admin').defaultTo(false);

	});

};

exports.down = async database => {
	await database.schema.dropTable('keys');
};
