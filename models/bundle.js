'use strict';

const fetch = require('node-fetch');
const uuid = require('uuid/v4');

module.exports = initModel;

function initModel(app) {

    // Model prototypal methods
    const Bundle = app.database.Model.extend({
        tableName: 'bundles',

        // Model initialization
        initialize() {

            // When a model is created...
            this.on('creating', () => {
                // Fill out automatic fields
                this.attributes.id = uuid();
                this.attributes.created_at = new Date();
            });

            // When a model is saved...
            this.on('saving', async () => {
                // Fill out automatic fields
                this.attributes.updated_at = new Date();

                // Validate the model
                await this.validateSave();

                return this;
            });

        },

        // Override default serialization so we can control
        // what's output
        serialize() {
            return {
                versionId: this.get('version_id'),
                id: this.get('id'),
                url: this.get('url'),
                sizes: this.get('sizes')
            };
        },

        // Validate the model before saving
        validateSave() {
            // TODO validate before save
            return true;
        }

        // Model static methods
    }, {
            // Fetch all bundles
            fetchAll() {
                return Bundle.collection().query(qb => {
                    qb.orderBy('created_at', 'desc');
                }).fetch();
            },

            fetchByVersionId(versionId, type) {
                return app.model.Bundle.collection().query(qb => {
                    qb.select('*');
                    qb.where('version_id', versionId);
                    qb.where('type', type);
                    qb.orderBy('created_at', 'desc');
                }).fetchOne();
            },

            async create(version, type) {
                try {
                    const buildServiceUrl = `https://www.ft.com/__origami/service/build/v2/bundles/${type}?modules=${version.get('name')}@${version.get('version')}`;

                    // Find size.
                    const rawResponse = await fetch(buildServiceUrl, {
                        method: 'HEAD',
                        headers: {
                            'Accept-Encoding': ''
                        }
                    });
                    const rawLength = rawResponse.headers.get('content-length');

                    // Find size with gzip.
                    const gzipResponse = await fetch(buildServiceUrl, {
                        method: 'HEAD',
                        headers: {
                            'Accept-Encoding': 'gzip'
                        }
                    });
                    const gzipLength = gzipResponse.headers.get('content-length');


                    // Create the new version
                    const bundle = new Bundle({
                        version_id: version.get('id'),
                        type,
                        url: buildServiceUrl,
                        sizes: {
                            raw: rawLength,
                            gzip: gzipLength,
                        }
                    });
                    await bundle.save();

                    // Return the new bundle
                    return bundle;

                } catch (error) {
                    // Assume errors are recoverable by default
                    if (error.isRecoverable !== false) {
                        error.isRecoverable = true;
                    }
                    throw error;
                }

            }

        });

    // Add the model to the app
    app.model.Bundle = Bundle;

}
