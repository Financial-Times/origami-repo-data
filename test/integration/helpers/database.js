'use strict';

module.exports = {
	clean: cleanDatabase,
	destroy: destroyDatabase,
	seed: seedDatabase
};

async function cleanDatabase(app) {
	await destroyDatabase(app);
	await app.database.knex.migrate.latest({
		directory: `${__dirname}/../../../data/migration`,
		tableName: 'migrations'
	});
}

async function destroyDatabase(app) {
	const result = await app.database.knex.raw(
		'SELECT tablename FROM pg_tables WHERE schemaname=\'public\''
	);
	await app.database.knex.raw(result.rows.map(row => {
		return `DROP TABLE ${row.tablename} CASCADE`;
	}).join(';'));
}

async function seedDatabase(app, seedDirectory) {
	await cleanDatabase(app);
	await app.database.knex.seed.run({
		directory: `${__dirname}/../seed/${seedDirectory}`
	});
}
