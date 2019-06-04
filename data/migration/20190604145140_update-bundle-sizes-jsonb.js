'use strict';

exports.up = async database => {

    // Change the sizes column to jsonb from json
    await database.schema.alterTable('bundles', table => {
        table.jsonb('sizes').alter();
    });

};

exports.down = async database => {

    // Change the sizes column to json from jsonb
    await database.schema.alterTable('bundles', table => {
        table.json('sizes').alter();
    });

};
