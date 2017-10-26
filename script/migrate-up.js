#!/usr/bin/env node
'use strict';

const bookshelf = require('bookshelf');
const dotenv = require('dotenv');
const knex = require('knex');

// Load options from an .env file if present
dotenv.load();

// Connect to the database
const database = knex({
	client: 'pg',
	connection: process.env.DATABASE_URL || 'postgres://localhost:5432/origami-repo-data'
});

// Migrate up
async function migrateUp() {
	try {
		await database.migrate.latest({
			directory: `${__dirname}/../data/migration`,
			tableName: 'migrations'
		});
		console.log('Migrated to latest database schema');
		process.exit(0);
	} catch (error) {
		console.error(error.stack);
		process.exit(1);
	}
}

migrateUp();
