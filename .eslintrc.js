'use strict';

module.exports = {
	'env': {
		'node': true,
		'es6': true
	},
	'parserOptions': {
		'ecmaVersion': 'latest',
		'sourceType': 'module'
	},
	'rules': {
		'no-unused-vars': 2,
		'no-undef': 2,
		'eqeqeq': 2,
		'no-underscore-dangle': 0,
		'guard-for-in': 2,
		'no-extend-native': 2,
		'wrap-iife': 2,
		'new-cap': 2,
		'no-caller': 2,
		'semi': [2, 'always'],
		'strict': [0, 'global'],
		'quotes': [1, 'single'],
		'no-loop-func': 2,
		'no-irregular-whitespace': 1,
		'no-multi-spaces': 2,
		'one-var': [2, 'never'],
		'constructor-super': 2,
		'no-this-before-super': 2,
		'no-var': 2,
		'prefer-const': 1,
		'no-const-assign': 2
	},
	'globals': {
		'after': true,
		'afterEach': true,
		'before': true,
		'beforeEach': true,
		'describe': true,
		'fetch': true,
		'it': true,
		'xdescribe': true,
		'xit': true
	}
};
