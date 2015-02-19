'use strict';


var demand = require('must');
var fcql = require('../../index');

describe('builder', function () {
    it('1', function () {
        var query = fcql.create().build();

        query.must.exist();
    });
});

