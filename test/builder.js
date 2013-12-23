'use strict';


var demand = require('must');
var _s = require('underscore.string');
var index = require('../index');

describe('builder', function () {
    it('1', function () {
        var query = index.create().build();

        query.must.exist();
    });
});

