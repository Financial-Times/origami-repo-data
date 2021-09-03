'use strict';

exports.up = async database => {
	await database.schema.alterTable('ingestion_queue', table => {
		table.string('url').nullable().alter();
		table.string('tag').nullable().alter();
		table.string('packageName').nullable();
		table.string('version').nullable();
	});

};

exports.down = async database => {
	await database.schema.alterTable('ingestion_queue', table => {
        table.dropIndex('packageName');
        table.dropIndex('version');
		table.string('url').notNullable().alter();
		table.string('tag').notNullable().alter();
	});

};
