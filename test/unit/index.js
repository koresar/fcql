'use strict';

var demand = require('must');
var index = require('../../index');

describe('index', function () {
    it('should collection function calls', function () {
        var q = index.select('a').from('b').where({c: 1});

        q.structure.must.exist();
        q.structure.select.must.exist();
        q.structure.from.must.exist();
        q.structure.where.must.exist();
    });
});

