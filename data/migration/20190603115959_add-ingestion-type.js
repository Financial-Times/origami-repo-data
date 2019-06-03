'use strict';

exports.up = async database => {

    // Add a type field to the ingestion_queue table
    await database.schema.table('ingestion_queue', table => {
        table.string('type').notNullable().defaultTo('version');
    });

};

exports.down = async database => {

    // Remove the type field from the ingestion_queue table
    await database.schema.table('ingestion_queue', table => {
        table.dropIndex('type');
    });

};
