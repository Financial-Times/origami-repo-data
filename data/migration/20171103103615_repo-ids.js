'use strict';

const { v5: uuidv5 } = require('uuid');

exports.up = async database => {

	// Add a repo ID field to the versions table
	await database.schema.table('versions', table => {
		table.string('repo_id');
		table.index('repo_id');
	});

	// Add repo IDs to existing versions
	const versions = await database.select().from('versions');
	for (const version of versions) {
		await database('versions').where('id', version.id).update({
			repo_id: uuidv5(version.url, uuidv5.URL)
		});
	}

};

exports.down = async database => {

	// Remove the repo ID field from the versions table
	await database.schema.table('versions', table => {
		table.dropColumn('repo_id');
	});

};
