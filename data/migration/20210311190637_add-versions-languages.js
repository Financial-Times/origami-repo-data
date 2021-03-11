'use strict';

exports.up = async database => {

    // Add an determined_languages field to the versions table
    await database.schema.table('versions', table => {
        table.jsonb('determined_languages');
    });

};

exports.down = async database => {

    // Remove the determined_languages field from the versions table
    await database.schema.table('versions', table => {
        table.dropColumn('determined_languages');
    });

};
