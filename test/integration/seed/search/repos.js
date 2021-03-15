'use strict';

const defaults = require('lodash/defaultsDeep');
const { v4: uuid } = require('uuid');

// Create versions for a mock component
exports.seed = async database => {

	function version(data) {
		const result = defaults(data, {
			id: uuid(),
			repo_id: uuid(),
			created_at: new Date('2018-01-01T00:00:00Z'),
			updated_at: new Date('2018-01-01T00:00:00Z'),
			url: `https://github.com/Financial-Times/${data.name}`,
			support_email: data.support_email || 'origami.support@ft.com',
			support_channel: data.support_channel || '#origami-support',
			tag: 'v1.0.0',
			version: '1.0.0',
			origami_version: '1',
			version_major: 1,
			version_minor: 0,
			version_patch: 0,
			version_prerelease: null,
			markdown: {
				readme: ''
			},
			manifests: {
				origami: {
					brands: [],
					keywords: [],
					demos: [],
					origamiVersion: 1,
				}
			}
		});
		result.markdown = JSON.stringify(result.markdown);
		result.manifests = JSON.stringify(result.manifests);
		return result;
	}

	await database('versions').insert([

		version({
			name: 'active-module',
			type: 'module',
			support_status: 'active',
			manifests: {
				origami: {
					description: 'banana apple pear',
					keywords: ['kiwi', 'pineapple', 'kumquat'],
					brands: [
						'master',
						'internal'
					]
				}
			}
		}),

		version({
			name: 'active-module-v2',
			type: 'module',
			support_status: 'active',
			origami_version: '2.0',
			manifests: {
				origami: {
					description: 'this follows the v2 origami specification',
					keywords: [],
					origamiVersion: '2.0',
					brands: []
				}
			}
		}),

		version({
			name: 'active-module-v2.1',
			type: 'module',
			support_status: 'active',
			origami_version: '2.1',
			manifests: {
				origami: {
					description: 'this follows the v2.1 origami specification',
					keywords: [],
					origamiVersion: '2.1',
					brands: []
				}
			}
		}),

		version({
			name: 'active-service',
			type: 'service',
			support_status: 'active',
			manifests: {
				origami: {
					description: 'pineapple apple peach banana'
				}
			}
		}),

		version({
			name: 'active-imageset',
			type: 'imageset',
			support_status: 'active',
			manifests: {
				origami: {
					keywords: 'banana, apple'
				}
			}
		}),

		version({
			name: 'deprecated-module',
			type: 'module',
			support_status: 'deprecated',
			manifests: {
				origami: {
					brands: [
						'master'
					],
					demos: [
						{
							name: 'example1',
							title: 'apples and pears'
						}
					]
				}
			}
		}),

		version({
			name: 'experimental-module',
			type: 'module',
			support_status: 'experimental',
			manifests: {
				origami: {
					description: 'an orange is not a banana',
					brands: [
						'internal'
					]
				}
			}
		}),

		version({
			name: 'maintained-module',
			type: 'module',
			support_status: 'maintained',
			manifests: {
				origami: {
					brands: [
						'internal'
					]
				}
			}
		}),

		version({
			name: 'dead-module (banana)',
			type: 'module',
			support_status: 'dead'
		}),

		version({
			name: 'new-module (banana)',
			type: 'module',
			support_status: 'active'
		}),

		version({
			name: 'kumquat',
			type: 'imageset',
			support_status: 'maintained'
		}),

		version({
			name: 'next-module',
			type: 'module',
			support_status: 'active',
			support_email: 'next.developers@ft.com',
			support_channel: '#ft-next-dev'
		}),

	]);
};
