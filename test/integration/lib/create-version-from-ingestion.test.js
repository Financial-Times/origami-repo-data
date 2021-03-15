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
            proclaim.include(version.get('languages'), 'js', 'Expected the Version to include "js" in the "languages" property.');
            proclaim.include(version.get('languages'), 'scss', 'Expected the Version to include "scss" in the "languages" property.');
        });
    });

    describe('given a v2 component Ingestion', () => {
        describe('that is valid, with JS and Sass', () => {
            it('saves a new Version with languages set', async () => {
                const url = 'https://github.com/Financial-Times/o-test-component';
                const tag = 'v2.0.1';

                const Ingestion = app.model.Ingestion;
                const ingestion = await new Ingestion({ url, tag, type: 'version' });

                await createVersionFromIngestion(ingestion, app.model.Version, app.github);

                const version = await app.model.Version.fetchOneByUrlAndTag(url, tag);

                proclaim.ok(version, 'No Version could be found for the Ingestion.');
                proclaim.include(version.get('languages'), 'js', 'Expected the Version to include "js" in the "languages" property.');
                proclaim.include(version.get('languages'), 'scss', 'Expected the Version to include "scss" in the "languages" property.');
            });
        });
        describe('that is valid, with JS but no Sass', () => {
            it('saves a new Version with languages set', async () => {
                const url = 'https://github.com/Financial-Times/o-test-component';
                const tag = 'v2.0.16';

                const Ingestion = app.model.Ingestion;
                const ingestion = await new Ingestion({ url, tag, type: 'version' });

                await createVersionFromIngestion(ingestion, app.model.Version, app.github);

                const version = await app.model.Version.fetchOneByUrlAndTag(url, tag);

                proclaim.ok(version, 'No Version could be found for the Ingestion.');
                proclaim.include(version.get('languages'), 'js', 'Expected the Version to include "js" in the "languages" property.');
                proclaim.notInclude(version.get('languages'), 'scss', 'Expected the Version to not include "scss" in the "languages" property, "js" only.');
            });
        });
    });
});
