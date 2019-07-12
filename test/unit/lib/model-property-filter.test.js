'use strict';

const assert = require('proclaim');
const sinon = require('sinon');
const propertyFilter = require('../../../lib/model-property-filter');

describe('lib/model-property-filter', () => {

    const item1 = {name: 'item1', get: sinon.stub()};
    item1.get.withArgs('a').returns(['1', '2', '3']);
    item1.get.withArgs('b').returns(['1', '2', '3']);
    const item2 = {name: 'item2', get: sinon.stub()};
    item2.get.withArgs('a').returns(['2', '3']);
    const item3 = {name: 'item3', get: sinon.stub()};
    item3.get.withArgs('a').returns(['3']);
    const item4 = {name: 'item4', get: sinon.stub()};
    item4.get.withArgs('a').returns([]);
    item4.get.withArgs('b').returns(['1', '2', '3']);
    const item5 = {name: 'item5', get: sinon.stub()};
    item5.get.withArgs('b').returns(['1', '2', '3']);
    const item6 = {name: 'item6', get: sinon.stub()};
    item6.get.withArgs('a').returns('1');
    item6.get.withArgs('b').returns('2');

    const tests = [
        {
            description: '"all" filters for items with a non-empty property value',
            property: 'a',
            value: 'all',
            expected: [item1, item2, item3, item6],
        },
        {
            description: '"none" filters for items with an empty property value',
            property: 'a',
            value: 'none',
            expected: [item4, item5],
        },
        {
            description: '"null" filters for items with an empty property value',
            property: 'a',
            value: 'null',
            expected: [item4, item5],
        },
        {
            description: '"undefined" filters for items with an empty property value',
            property: 'a',
            value: 'undefined',
            expected: [item4, item5],
        },
        {
            description: '"1" filters for items with a property value which match (in string or array)',
            property: 'a',
            value: '1',
            expected: [item1, item6],
        },
        {
            description: '"1,2" filters for items with a property value which match (in string or array)',
            property: 'a',
            value: '1,2',
            expected: [item1, item2, item6],
        },
    ];

    tests.forEach(test => {
        it(test.description, () => {
            const data = [
                item1,
                item2,
                item3,
                item4,
                item5,
                item6
            ];
            const actual = data.filter(propertyFilter(test.property, test.value));
            assert.deepEqual(actual.map(a => a.name), test.expected.map(e => e.name), 'Did not filter the expected items.');
        });
    });

});
