'use strict';

const joi = require('joi').extend(require('joi-extension-semver'));
const fetch = require('node-fetch');
const uuid = require('uuid/v4');
const propertyFilter = require('../lib/model-property-filter');

module.exports = initModel;

function initModel(app) {

    /**
     * Update a bundle for a given version, type, and brand, or create one if
     * non exist.
     *
     * @param {Version} version - the Version to update a bundle for.
     * @param {string} type - the type of the bundle to update, e.g. 'css' or 'js'.
     * @param {string} brand [null] - the brand of the bundle to update, e.g. 'internal' (optional).
     * @return {Bundle} - bundle information for the given version, type, and brand
     */
    async function updateBundleForVersion(version, type, brand = null) {
        const buildServiceUrl = new URL(`https://www.ft.com/__origami/service/build/v2/bundles/${type}`);
        buildServiceUrl.searchParams.append('modules', `${version.get('name')}@${version.get('version')}`);
        if (brand) {
            buildServiceUrl.searchParams.append('brand', brand);
        }
        const timeout = 750;

        // Find bundle sizes for differing "Accept-Encoding" values.
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding
        const sizes = {};
        for (const enconding of ['', 'gzip']) {
            try {
                const response = await fetch(buildServiceUrl.toString(), {
                    method: 'HEAD',
                    headers: {
                        'Accept-Encoding': enconding
                    },
                    timeout
                });
                if (!response.ok) {
                    const responseError = new Error('Could not get bundle from the Origami Build Service.');
                    responseError.status = response.status;
                    throw responseError;
                }
                sizes[enconding || 'raw'] = response.headers.get('content-length');
            } catch (error) {
                // Recoverable outside of:
                // - Compilation Error (560)
                // - Conflict (409)
                // - Bad Request (400)
                // https://www.ft.com/__origami/service/build/v2/#api-reference
                const buildServiceError = new Error(`Unable to load ${enconding || 'non-encoded'} bundle from ${buildServiceUrl.toString()}${error.status ? ` (status: ${error.status}).` : ` within ${timeout}ms.`}`);
                buildServiceError.isRecoverable = error.status && [400, 409, 560].includes(error.status) ? false : true;
                throw buildServiceError;
            }
        }

        // Update the bundle if one exists for the version,
        // bundle type, and brand.
        let bundle = await Bundle.fetchUnique(version.get('id'), type, brand);
        if (bundle) {
            bundle.set('url', buildServiceUrl.toString());
            bundle.set('sizes', sizes);
        }

        // Or create a new bundle if one does not exist.
        if (!bundle) {
            bundle = new Bundle({
                version_id: version.get('id'),
                type,
                brand,
                sizes,
                url: buildServiceUrl.toString(),
            });
        }

        await bundle.save();

        return bundle;
    }

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
                // Get brands from Version.
                const brands = version.brands.filter(brand => typeof brand === 'string');
                // Get bundle types (js and or css) from Version.
                const types = ['js', 'css'].filter(type => {
                    type = type === 'css' ? 'scss' : type;
                    return version.languages.includes(type);
                });
                // Get combinations of brands and languages to collect Bundle
                // information for.
                const combinations = [];
                types.forEach(type => {
                    if (type === 'css' && brands.length > 0) {
                        // Get the size of CSS bundles for all brands.
                        combinations.push(...brands.map(brand => {
                            return {
                                type,
                                brand
                            };
                        }));
                    } else {
                        combinations.push({type});
                    }
                });

                // Update or create a Bundle for each combination of brand and
                // language for the given Version.
                const modifiedBundles = [];
                const bundleUpdateErrors = [];
                for (const {type, brand} of combinations) {
                    try {
                        const bundle = await updateBundleForVersion(version, type, brand);
                        modifiedBundles.push(bundle);
                    } catch (error) {
                        bundleUpdateErrors.push(error);
                    }
                }

                // Not all bundle sizes could be generated.
                if (bundleUpdateErrors.length > 0) {
                    const allBundlesError = new Error(`Not all bundle sizes could be found for ${version.get('name')}@${version.get('version')}. Bundles updated: ${modifiedBundles.map(b => b.id)}. Errors: ${bundleUpdateErrors.map(e => e.message).join(' ')}`);
                    allBundlesError.isRecoverable = bundleUpdateErrors.some(e => e.isRecoverable);
                    throw allBundlesError;
                }

                return modifiedBundles;
            }
        });

    // Add the model to the app
    app.model.Bundle = Bundle;

}
