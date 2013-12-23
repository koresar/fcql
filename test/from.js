'use strict';

var fcql = require('../index');

describe('from', function () {
    var query;
    beforeEach(function () {
        query = fcql.select('something');
    });

    it('should demand table name', function () {
        var q = query.from();

        q.build.bind(q).must.throw(/table name/);
    });

    it('should write FROM tableName', function () {
        var q = query.from('tableName');

        q.build().must.include('FROM tableName');
    });
});