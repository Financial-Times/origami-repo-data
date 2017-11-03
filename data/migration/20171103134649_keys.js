'use strict';

exports.up = async database => {

	// Create the keys table
	await database.schema.createTable('keys', table => {

		// Meta information
		table.string('id').unique().primary();
		table.timestamp('created_at').defaultTo(database.fn.now());
		table.timestamp('updated_at').defaultTo(database.fn.now());
		table.timestamp('last_used_at').defaultTo(null);

		// Key information
		table.string('name').notNullable();
		table.string('key').notNullable();
		table.boolean('read').defaultTo(true);
		table.boolean('write').defaultTo(false);
		table.boolean('admin').defaultTo(false);

	});

};

exports.down = async database => {
	await database.schema.dropTable('keys');
};
