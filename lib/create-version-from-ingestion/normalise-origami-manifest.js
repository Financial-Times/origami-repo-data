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

	// Convert the "component" origamiType to "module" in the database
	if (normalisedManifest.origamiType === 'component') {
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
