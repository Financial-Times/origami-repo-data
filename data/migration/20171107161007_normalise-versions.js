'use strict';

const semver = require('semver');

exports.up = async database => {

	// Add a normalised version field to the versions table,
	// and also start to index the version field as we're
	// querying against it now
	await database.schema.table('versions', table => {
		table.string('version_normalised');
		table.index('version');
		table.index('version_normalised');
	});

	// Add normalised version numbers to existing versions
	const versions = await database.select().from('versions');
	for (const version of versions) {
		await database('versions').where('id', version.id).update({
			version_normalised: semver.valid(version.version)
		});
	}

};

exports.down = async database => {

	// Remove the normalised version field from the versions table
	// and drop the index for the version field
	await database.schema.table('versions', table => {
		table.dropColumn('version_normalised');
		table.dropIndex('version');
	});

};
