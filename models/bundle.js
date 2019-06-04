'use strict';

const joi = require('joi').extend(require('joi-extension-semver'));
const fetch = require('node-fetch');
const uuid = require('uuid/v4');

module.exports = initModel;

function initModel(app) {

    // Model validation schema
    const schema = joi.object().keys({
        version_id: joi.string().required(),
        url: joi.string().uri({
            scheme: 'https'
        }).required(),
        sizes: joi.object({
            arg: joi.string().valid('raw', 'gzip', 'br'),
            value: joi.string(),
        }).required()
    });

    // Model prototypal methods
    const Bundle = app.database.Model.extend({
        tableName: 'bundles',
        version: function () {
            return this.belongsTo(app.model.Version);
        },

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

        serializeWithVersionName() {
            const bundle = this.serialize();
            bundle.name = this.related('version').get('name');
            return bundle;
        },

        // Validate the model before saving
        // Validate the model before saving
        validateSave() {
            return new Promise((resolve, reject) => {
                // Validate against the schema
                joi.validate(this.attributes, schema, {
                    abortEarly: false,
                    allowUnknown: true
                }, async error => {
                    if (error) {
                        return reject(error);
                    }

                    resolve();
                });
            });
        },

        // Model static methods
    }, {
            // Fetch all bundles
            fetchAll() {
                return Bundle.collection().query(qb => {
                    qb.orderBy('created_at', 'desc');
                }).fetch();
            },

            fetchByVersionId(versionId, type) {
                return Bundle.collection().query(qb => {
                    qb.select('*');
                    qb.where('version_id', versionId);
                    qb.where('type', type);
                    qb.orderBy('created_at', 'desc');
                }).fetchOne();
            },

            fetchByUrlAndTag(url, tag) {
                return Bundle.collection().query(qb => {
                    qb.innerJoin('versions', 'version_id', '=', 'versions.id');
                    qb.select('*');
                    qb.where('versions.url', url);
                    qb.where('versions.tag', tag);
                    qb.orderBy('bundles.created_at', 'desc');
                }).fetch();
            },

            fetchByRepoId(repoId, type) {
                return Bundle.collection().query(qb => {
                    qb.innerJoin('versions', 'version_id', '=', 'versions.id');
                    qb.select('bundles.*');
                    qb.where('bundles.type', type);
                    qb.where('versions.repo_id', repoId);
                    qb.orderBy('bundles.created_at', 'desc');
                }).fetch({ withRelated: ['version'] });
            },

            async createBundlesForVersion(version) {
                if (!version) {
                    const error = new Error('Could not gather bundle information for a version which does not exist.');
                    error.isRecoverable = false;
                    throw error;
                }
                const bundleTypes = version.languages.filter(language => ['css', 'js'].includes(language));
                const bundles = [];
                for (const bundleType of bundleTypes) {
                    try {
                        const buildServiceUrl = `https://www.ft.com/__origami/service/build/v2/bundles/${bundleType}?modules=${version.get('name')}@${version.get('version')}`;
                        const timeout = 500;

                        // Find size.
                        let rawLength;
                        try {
                            const rawResponse = await fetch(buildServiceUrl, {
                                method: 'HEAD',
                                headers: {
                                    'Accept-Encoding': ''
                                },
                                timeout
                            });
                            rawLength = rawResponse.headers.get('content-length');
                        } catch (error) {
                            throw new Error(`Unable to load non-encoded bundle from ${buildServiceUrl} within 500ms.`);
                        }

                        // Find size with gzip.
                        let gzipLength;
                        try {
                            const gzipResponse = await fetch(buildServiceUrl, {
                                method: 'HEAD',
                                headers: {
                                    'Accept-Encoding': 'gzip'
                                },
                                timeout
                            });
                            gzipLength = gzipResponse.headers.get('content-length');
                        } catch (error) {
                            throw new Error(`Unable to load gzip encoded bundle from ${buildServiceUrl} within 500ms.`);
                        }

                        // Create and save the new version
                        const bundle = new Bundle({
                            version_id: version.get('id'),
                            type: bundleType,
                            url: buildServiceUrl,
                            sizes: {
                                raw: rawLength,
                                gzip: gzipLength,
                            }
                        });
                        await bundle.save();
                        bundles.push(bundle);

                    } catch (error) {
                        // Assume errors are recoverable by default
                        if (error.isRecoverable !== false) {
                            error.isRecoverable = true;
                        }
                        throw error;
                    }
                    return bundles;
                }
            }
        });

    // Add the model to the app
    app.model.Bundle = Bundle;

}
