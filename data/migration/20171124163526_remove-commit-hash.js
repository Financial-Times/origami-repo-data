'use strict';

exports.up = async database => {

	// Remove the commit_hash column
	await database.schema.table('versions', table => {
		table.dropColumn('commit_hash');
	});

};

exports.down = async () => {

	// We can't recover from this 😱

};
