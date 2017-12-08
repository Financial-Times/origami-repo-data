'use strict';

exports.up = async database => {

	// Add a support_status field to the versions table
	await database.schema.table('versions', table => {
		table.string('support_status').notNullable().defaultTo('dead');
		table.index('support_status');
	});

};

exports.down = async database => {

	// Remove the support_status field
	await database.schema.table('versions', table => {
		table.dropIndex('support_status');
		table.dropColumn('support_status');
	});

};
