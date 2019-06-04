'use strict';

exports.up = async database => {

    // Change json columns to jsonb
    await database.schema.alterTable('versions', table => {
        table.jsonb('manifests').alter();
        table.jsonb('markdown').alter();
    });

};

exports.down = async database => {

    // Change jsonb columns to json
    await database.schema.alterTable('versions', table => {
        table.json('manifests').alter();
        table.json('markdown').alter();
    });

};
