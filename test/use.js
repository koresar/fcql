'use strict';

var fcql = require('../fluent-cql');

describe('use', function () {
    var query;

    it('should demand keyspace name', function () {
        query = fcql.use();

        query.err.must.exist();
        query.err.must.include('keyspace name');
    });

    it('should write USE keyspace', function () {
        query = fcql.use('keyspaceName');

        query.build().must.include('USE keyspaceName');
    });
});