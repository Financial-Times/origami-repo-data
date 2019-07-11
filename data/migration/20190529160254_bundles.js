'use strict';

exports.up = async database => {

    // Create the bundles table
    await database.schema.createTable('bundles', table => {
        // Meta information
        table.string('id').unique().primary();
        table.string('version_id').notNullable();
        table.timestamp('created_at').defaultTo(database.fn.now());
        table.timestamp('updated_at').defaultTo(database.fn.now());

        // Bundle information
        table.string('language').notNullable();
        table.string('brand').nullable();
        table.string('url').notNullable();
        table.jsonb('sizes').notNullable();

        // Add column Indexs
        table.index('language');
        table.index('brand');

        // Add version relationship.
        table.foreign('version_id').references('versions.id');
    });

};

exports.down = async database => {
    await database.schema.dropTable('bundles');
};
