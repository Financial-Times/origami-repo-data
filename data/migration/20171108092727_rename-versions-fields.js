'use strict';

exports.up = async database => {

	// Rename the version columns
	await database.schema.table('versions', table => {
		table.dropIndex('version');
		table.dropIndex('version_normalised');

		table.renameColumn('version', 'tag');
		table.renameColumn('version_normalised', 'version');

		table.index('tag');
		table.index('version');
	});

};

exports.down = async database => {

	// Rename the version columns back
	await database.schema.table('versions', table => {
		table.dropIndex('tag');
		table.dropIndex('version');

		table.renameColumn('version', 'version_normalised');
		table.renameColumn('tag', 'version');

		table.index('version');
		table.index('version_normalised');
	});

};
