'use strict';

const proclaim = require('proclaim');

const normaliseOrigamiManifest = require('../../../lib/create-version-from-ingestion/normalise-origami-manifest');

describe('normaliseOrigamiManifest', () => {

  describe('given incorrect', () => {
    let origamiManifest;
    beforeEach(() => {
      origamiManifest = {
        'origamiType': 'component',
        'brands': ['core','internal','whitelabel'],
        'supportStatus': 'experimental',
        'browserFeatures': {},
        'demosDefaults': {},
        'demos': []
      };
    });
    it('origami version(3.0) to manifest noramliser throws an error', async () => {
      origamiManifest.origamiVersion = '3.0';
      proclaim.throws(() => normaliseOrigamiManifest(origamiManifest), 'Could not normalise manifest. Origami version unknown.');
    });
    it('origami version (not a string) to manifest noramliser throws an error', async () => {
      origamiManifest.origamiVersion = 3;
      proclaim.throws(() => normaliseOrigamiManifest(origamiManifest), 'Could not normalise manifest. Origami version unknown.');
    });
    it('origami version(random string) to manifest noramliser throws an error', async () => {
      origamiManifest.origamiVersion = 'random';
      proclaim.throws(() => normaliseOrigamiManifest(origamiManifest), 'Could not normalise manifest. Origami version unknown.');
    });
  });
  describe('given correct', () => {
    let origamiManifest;
    beforeEach(() => {
      origamiManifest = {
        'origamiType': 'component',
        'brands': ['core','internal','whitelabel'],
        'supportStatus': 'experimental',
        'browserFeatures': {},
        'demosDefaults': {},
        'demos': []
      };
    });
    it('origami version(2.0) to manifest noramliser returns json', async () => {
      origamiManifest.origamiVersion = '2.0';
      const normalisedManifest = normaliseOrigamiManifest(origamiManifest);
      proclaim.isObject(normalisedManifest);
      proclaim.equal(normalisedManifest.origamiVersion, '2.0');
    });
    it('origami version(2.0.1) to manifest noramliser returns json', async () => {
      origamiManifest.origamiVersion = '2.0.1';
      const normalisedManifest = normaliseOrigamiManifest(origamiManifest);
      proclaim.isObject(normalisedManifest);
      proclaim.equal(normalisedManifest.origamiVersion, '2.0.1');
    });
    it('origami version(1) to manifest noramliser returns json', async () => {
      delete origamiManifest.origamiVersion;
      origamiManifest.version = '1';
      const normalisedManifest = normaliseOrigamiManifest(origamiManifest);
      proclaim.isObject(normalisedManifest);
      proclaim.equal(normalisedManifest.version, '1');
    });
  });

});