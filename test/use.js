'use strict';

var fcql = require('../index');
var demand = require('must');

describe('use', function () {
    var query;

    it('should demand keyspace name', function () {
        var q = fcql.use();

        q.build.bind(q).must.throw(/keyspace name/);
    });

    it('should write USE keyspace', function () {
        var q = fcql.use('keyspaceName');

        q.build().must.include('USE keyspaceName');
    });
});