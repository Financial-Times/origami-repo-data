'use strict';

const semver = require('semver');

exports.up = async database => {

	// Add split version fields to the versions table
	await database.schema.table('versions', table => {
		table.integer('version_major').notNullable().defaultTo(0);
		table.integer('version_minor').notNullable().defaultTo(0);
		table.integer('version_patch').notNullable().defaultTo(0);
		table.string('version_prerelease').defaultTo(null);
		table.index('version_major');
		table.index('version_minor');
		table.index('version_patch');
		table.index('version_prerelease');
	});

	// Fill these fields for all existing versions
	const versions = await database.select().from('versions');
	for (const version of versions) {
		const prerelease = semver.prerelease(version.version);
		await database('versions').where('id', version.id).update({
			version_major: semver.major(version.version),
			version_minor: semver.minor(version.version),
			version_patch: semver.patch(version.version),
			version_prerelease: (prerelease ? prerelease.join('.') : prerelease)
		});
	}

};

exports.down = async database => {

	// Remove the split version fields
	await database.schema.table('versions', table => {
		table.dropIndex('version_major');
		table.dropIndex('version_minor');
		table.dropIndex('version_patch');
		table.dropIndex('version_prerelease');
		table.dropColumn('version_major');
		table.dropColumn('version_minor');
		table.dropColumn('version_patch');
		table.dropColumn('version_prerelease');
	});

};
