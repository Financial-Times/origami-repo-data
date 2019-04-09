#!/usr/bin/env node
'use strict';

const dotenv = require('dotenv');
const knex = require('knex');

// Load options from an .env file if present
dotenv.config();

// Check for a migration name
const migrationName = process.argv[2];
if (!migrationName) {
	console.log('Usage: ./script/create-migration.js <name>');
	process.exit(1);
}

// Connect to the database
const database = knex({
	client: 'pg',
	connection: process.env.DATABASE_URL || 'postgres://localhost:5432/origami-repo-data'
});

// Create a migration
async function createMigration() {
	try {
		const result = await database.migrate.make(migrationName, {
			directory: `${__dirname}/../data/migration`,
			tableName: 'migrations'
		});
		console.log(`Created migration file: ${result}`);
		process.exit(0);
	} catch (error) {
		console.error(error.stack);
		process.exit(1);
	}
}

createMigration();
