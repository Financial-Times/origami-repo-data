'use strict';

const path = require('path');

/**
 * Set languages using the same logic as the previous computed property.
 *
 * @param {Object} manifests
 * @param {Object} manifests.bower
 * @param {Object} manifests.package
 *
 * @returns {Array} - languages, e.g. ["js", "scss"]
 */
function getLanguages(manifests) {
    manifests = manifests || {};
    let mainPaths = [];

    // Order: bower, package
    if (manifests.bower) {
        if (typeof manifests.bower.main === 'string') {
            mainPaths.push(manifests.bower.main);
        } else if (Array.isArray(manifests.bower.main)) {
            mainPaths = manifests.bower.main.filter(main => typeof main === 'string');
        }
    } else if (manifests.package && typeof manifests.package.main === 'string') {
        mainPaths.push(manifests.package.main);
    }

    const languages = mainPaths
        .map(mainPath => path.extname(mainPath).slice(1).toLowerCase())
        .filter(mainPath => mainPath)
        .sort();

    return Array.from(new Set(languages));
}

exports.up = async database => {

    // Add an languages field to the versions table
    await database.schema.table('versions', table => {
        table.jsonb('languages').notNullable().defaultTo([]);
    });

    const results = await database.column(['id', 'manifests']).select().from('versions');

    for (const {id, manifests} of results) {
        const languages = getLanguages(manifests);
        await database('versions')
            .where('id', '=', id)
            .update({ languages: JSON.stringify(languages) });
    }

};

exports.down = async database => {

    // Remove the languages field from the versions table
    await database.schema.table('versions', table => {
        table.dropColumn('languages');
    });

};
