'use strict';

exports.up = async database => {

    // Add an origami_version field to the versions table
    await database.schema.table('versions', table => {
        table.string('origami_version').notNullable().defaultTo('1');
    });

};

exports.down = async database => {

    // Remove the origami_version field from the versions table
    await database.schema.table('versions', table => {
        table.dropIndex('origami_version');
    });

};
