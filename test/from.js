'use strict';

var fcql = require('../fluent-cql');

describe('from', function () {
    var query;
    beforeEach(function () {
        query = fcql.select('something');
    });

    it('should demand table name', function () {
        query.from();

        query.err.must.exist();
        query.err.must.include('table name');
    });

    it('should write FROM tableName', function () {
        query.from('tableName');

        query.build().must.include('FROM tableName');
    });
});