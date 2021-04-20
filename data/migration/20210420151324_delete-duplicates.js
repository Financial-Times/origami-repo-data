
'use strict';


exports.up = async database => {

    const results = await database.raw('SELECT * FROM (SELECT DISTINCT name, version, COUNT(*) FROM versions GROUP BY name, version) as foo WHERE count > 1 ORDER BY count DESC;');

    for (const result of results.rows) {

        const duplicates = await database.raw(
            `SELECT id, name, version, updated_at FROM versions WHERE name = '${result.name}' AND version='${result.version}' ORDER BY updated_at;`
        );

        // Keep the most recent duplicate
        const mostRecentDuplicate = duplicates.rows.pop();
        const oldDuplicates = duplicates.rows;

        console.log(`Keeping: ${JSON.stringify(mostRecentDuplicate)}.\nDeleting: ${oldDuplicates.map(d => d.id)}\n\n`);

        await database('bundles')
            .whereIn('version_id', oldDuplicates.map(d => d.id))
            .del();

        await database('versions')
            .whereIn('id', oldDuplicates.map(d => d.id))
            .del();
    }
};
exports.down = function() {
    // there's no going back (other than a manual db restore, or re-ingesting versions)
};
