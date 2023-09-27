'use strict';

const cloneDeep = require('lodash/cloneDeep');

// Normalise an Origami manifest file. Because we use the manifest
// to create fields in the database, we need to ensure that it
// mostly conforms to the Origami spec.
module.exports = function normaliseOrigamiManifest(manifest) {
	const origamiSupportEmail = 'origami.support@ft.com';

	const normalisedManifest = cloneDeep(manifest);

	// Ensure that origamiType is a string or null
	if (typeof normalisedManifest.origamiType !== 'string') {
		normalisedManifest.origamiType = null;
	}

  if (manifest.origamiVersion === 2) {
    manifest.origamiVersion = '2.0';
  }
	// Convert the "component" origamiType to "module" in the database for
	// spec v1 components. The "component" alias was introduced after "module"
	// and any project using repo data should be able to continue to filter v1
	// projects using the "module" type without requiring an update. However,
	// spec v2 drops the "module" type for "component" only.
	const specV1 = (!manifest.origamiVersion || `${manifest.origamiVersion}` === '1'); // assume falsy is spec v1, pre linting
  // we are checking if the origami version is 2.0.1 because n-notification has origamiVersion defined as 2.0.1
  const specV2 = manifest.origamiVersion === '2.0' || manifest.origamiVersion === '2.0.1';
  if (!specV2 && !specV1) {
    const error = new Error('Could not normalise manifest. Origami version unknown.');
    error.isRecoverable = false;
    throw error;
  }

	if (specV1 && normalisedManifest.origamiType === 'component') {
    normalisedManifest.origamiType = 'module';
	}

	// Ensure that support status is a string or null
	if (typeof normalisedManifest.support !== 'string') {
		normalisedManifest.support = null;
	}

	// Ensure that we have all the support information that we need
	if (typeof normalisedManifest.supportContact !== 'object' || normalisedManifest.supportContact === null) {
		normalisedManifest.supportContact = {
			email: null,
			slack: null
		};
	}
	if (!normalisedManifest.supportContact.email && typeof normalisedManifest.support === 'string' && normalisedManifest.support.includes('@')) {
		normalisedManifest.supportContact.email = normalisedManifest.support;
	}
	if (!normalisedManifest.supportContact.email) {
		normalisedManifest.supportContact.email = origamiSupportEmail;
	}
	if (!normalisedManifest.supportContact.slack && normalisedManifest.supportContact.email === origamiSupportEmail) {
		normalisedManifest.supportContact.slack = 'financialtimes/origami-support';
	}

	return normalisedManifest;
};
