'use strict';

const path = require('path');

/**
 * Get languages for the version, falling back through different manifests
 *
 * @param {Object} origamiManifest
 * @param {Object} bowerManifest []
 * @param {Object} packageManifest []
 * @param {String} tag - The Github tag for this version
 * @param {String} owner - The Github organisation for this version
 * @param {String} repo - The Github repository name for this version
 * @param {GitHubClient} githubClient - The app's Github client wrapper
 * @returns
 */
module.exports = async function getVersionLanguages(
    origamiManifest,
    bowerManifest,
    packageManifest,
    tag,
    owner,
    repo,
    githubClient
) {
    origamiManifest = origamiManifest || {};
    bowerManifest = bowerManifest || {};
    packageManifest = packageManifest || {};

    const mainPaths = [];

    const component = ['module', 'component'].includes(
        origamiManifest.origamiType
    );
    const specV1 = origamiManifest.origamiVersion === 1;
    const specV1Component = specV1 && component;

    // Bower: old spec v1 projects are the most likely to be misconfigured,
    // if there is a bower.json check it.
    if (bowerManifest.main) {
        mainPaths.push(...bowerManifest.main.flatMap(a => a));
    }

    // Package, browser: don't bother checking package.json if we are confident
    // that the manifests given are for a spec v1 component, as v1 components
    // use only bower dependencies.
    if (!specV1Component) {
        mainPaths.push(packageManifest.browser);
    }

    // Package, main: components don't use the main field, libraries etc. do.
    if (!component) {
        mainPaths.push(packageManifest.main);
    }

    // Sass: non-v1 components do not use Bower but will have an index Sass file.
    if (component && !specV1Component) {
        const sassIndex = await githubClient.loadFile({
            path: '_index.scss',
            ref: tag,
            owner,
            repo
        });
        if (sassIndex) {
            mainPaths.push('_index.scss');
        }
    }

    const languages = mainPaths
        .filter(mainPath => typeof mainPath === 'string')
        .map(mainPath => path.extname(mainPath).slice(1).toLowerCase())
        .filter(mainPath => mainPath)
        .sort();

    return Array.from(new Set(languages));
};
