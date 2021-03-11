/* global app */
'use strict';

const database = require('../helpers/database');
const createVersionFromIngestion = require('../../../lib/create-version-from-ingestion');
const proclaim = require('proclaim');

describe('createVersionFromIngestion', () => {

    beforeEach(async () => {
        await database.clean(app);
    });

    describe('given a v1 component Ingestion', () => {
        it('saves a new Version if the spec v1 component Ingestion is valid', async () => {
            const url = 'https://github.com/Financial-Times/o-test-component';
            const tag = 'v1.0.28';

            const Ingestion = app.model.Ingestion;
            const ingestion = await new Ingestion({ url, tag, type: 'version' });

            await createVersionFromIngestion(ingestion, app.model.Version, app.github);

            const version = await app.model.Version.fetchOneByUrlAndTag(url, tag);

            proclaim.ok(version, 'No Version could be found for the Ingestion.');
        });
    });

    describe('given a v2 component Ingestion', () => {
        it('saves a new Version if the spec v2 component Ingestion is valid', async () => {
            const url = 'https://github.com/Financial-Times/o-test-component';
            const tag = 'v2.0.1';

            const Ingestion = app.model.Ingestion;
            const ingestion = await new Ingestion({ url, tag, type: 'version' });

            await createVersionFromIngestion(ingestion, app.model.Version, app.github);

            const version = await app.model.Version.fetchOneByUrlAndTag(url, tag);

            proclaim.ok(version, 'No Version could be found for the Ingestion.');
        });
    });
});
