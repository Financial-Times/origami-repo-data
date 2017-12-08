'use strict';

exports.up = async database => {

	// Index version URLs
	await database.schema.table('versions', table => {
		table.index('url');
	});

};

exports.down = async database => {

	// Remove the version URL index
	await database.schema.table('versions', table => {
		table.dropIndex('url');
	});

};
