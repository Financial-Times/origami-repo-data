'use strict';

const joi = require('joi').extend(require('joi-extension-semver'));
const fetch = require('node-fetch');
const uuid = require('uuid/v4');
const propertyFilter = require('../lib/model-property-filter');

module.exports = initModel;

function initModel(app) {

    // Model validation schema
    const schema = joi.object().keys({
        version_id: joi.string().required(),
        type: joi.string().valid('js', 'css').required(),
        brand: joi.string().optional().allow(null),
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
                brand: this.get('brand'),
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

            fetchUnique(versionId, type, brand) {
                return Bundle.collection().query(qb => {
                    qb.select('*');
                    qb.where('version_id', versionId);
                    qb.where('type', type);
                    qb.where('brand', brand || null);
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

            fetchByRepoIdAndBrand(repoId, type, brand) {
                const bundles = Bundle.fetchByRepoId(repoId, type);
                return bundles.filter(propertyFilter('brand', brand));
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

            async updateBundlesForVersion(version) {
                if (!version) {
                    const error = new Error('Could not gather bundle information for a version which does not exist.');
                    error.isRecoverable = false;
                    throw error;
                }
                // Get version bundle types (js and or css).
                const bundleTypes = [];
                if (version.languages.includes('js')) {
                    bundleTypes.push('js');
                }
                if (version.languages.includes('scss')) {
                    bundleTypes.push('css');
                }
                // Get version brands.
                const brands = version.brands.filter(brand => typeof brand === 'string');
                // Get combinations of brands and languages to collect Bundle
                // information for.
                const combinations = [];
                bundleTypes.forEach(bundleType => {
                    if (bundleType === 'css') {
                        // Get the size of CSS bundles for all brands.
                        combinations.push(...brands.map(brand => {
                            return {
                                bundleType,
                                brand
                            };
                        }));
                    } else {
                        combinations.push({bundleType});
                    }
                });
                // Create Bundle for each combination of brand and language for
                // the given Version.
                const bundles = [];
                for (const combination of combinations) {
                    try {
                        const buildServiceUrl = new URL(`https://www.ft.com/__origami/service/build/v2/bundles/${combination.bundleType}`);
                        buildServiceUrl.searchParams.append('modules', `${version.get('name')}@${version.get('version')}`);
                        if (combination.brand) {
                            buildServiceUrl.searchParams.append('brand', combination.brand);
                        }
                        const timeout = 500;

                        // Find size.
                        let rawLength;
                        try {
                            const rawResponse = await fetch(buildServiceUrl.toString(), {
                                method: 'HEAD',
                                headers: {
                                    'Accept-Encoding': ''
                                },
                                timeout
                            });
                            rawLength = rawResponse.headers.get('content-length');
                        } catch (error) {
                            throw new Error(`Unable to load non-encoded bundle from ${buildServiceUrl.toString()} within 500ms.`);
                        }

                        // Find size with gzip.
                        let gzipLength;
                        try {
                            const gzipResponse = await fetch(buildServiceUrl.toString(), {
                                method: 'HEAD',
                                headers: {
                                    'Accept-Encoding': 'gzip'
                                },
                                timeout
                            });
                            gzipLength = gzipResponse.headers.get('content-length');
                        } catch (error) {
                            throw new Error(`Unable to load gzip encoded bundle from ${buildServiceUrl.toString()} within 500ms.`);
                        }

                        // Update the bundle if one exists for the version,
                        // bundle type, and brand.
                        let bundle = await Bundle.fetchUnique(version.get('id'), combination.bundleType, combination.brand);
                        if (bundle) {
                            bundle.set('url', buildServiceUrl.toString());
                            bundle.set('sizes', {
                                raw: rawLength,
                                gzip: gzipLength,
                            });
                        }
                        // Or create a new bundle if one does not exist.
                        if (!bundle) {
                            bundle = new Bundle({
                                version_id: version.get('id'),
                                type: combination.bundleType,
                                brand: combination.brand,
                                url: buildServiceUrl.toString(),
                                sizes: {
                                    raw: rawLength,
                                    gzip: gzipLength,
                                }
                            });
                        }
                        await bundle.save();
                        bundles.push(bundle);

                    } catch (error) {
                        // Assume errors are recoverable by default
                        if (error.isRecoverable !== false) {
                            error.isRecoverable = true;
                        }
                        throw error;
                    }
                }
                return bundles;
            }
        });

    // Add the model to the app
    app.model.Bundle = Bundle;

}
