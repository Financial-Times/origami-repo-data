#!/usr/bin/env node
'use strict';

const dotenv = require('dotenv');
const knex = require('knex');
const parse = require('pg-connection-string').parse;

// Load options from an .env file if present
dotenv.config();

const connectionConfig = parse(process.env.DATABASE_URL || 'postgres://localhost:5432/origami-repo-data');
if (connectionConfig.host !== 'localhost') {
	connectionConfig.ssl = { rejectUnauthorized: false };
}
// Connect to the database
const database = knex({
	client: 'pg',
	connection: connectionConfig
});

// Seed the database
async function seed() {
	try {
		await database.seed.run({
			directory: `${__dirname}/../data/seed/demo`
		});
		console.log('Seeded the database with demo data');
		process.exit(0);
	} catch (error) {
		console.error(error.stack);
		process.exit(1);
	}
}

seed();
