'use strict';

var demand = require('must');
var fcql = require('../index');

describe('delete', function () {
    it('should allow only string arguments', function () {
        var q1 = fcql.delete(1);
        var q2 = fcql.delete(true);
        var q3 = fcql.delete([1, 2]);

        q1.build.bind(q1).must.throw(/argument/);
        q2.build.bind(q1).must.throw(/argument/);
        q3.build.bind(q1).must.throw(/argument/);
    });

    it('should build proper with no arguments', function () {
        var q = fcql.delete();

        q.build().must.include('DELETE');
    });

    it('should build proper with several arguments', function () {
        var q = fcql.delete("column1", "column2");

        q.build().must.include('DELETE column1, column2');
    });

    it('should build proper with array argument', function () {
        var q = fcql.delete(["column1", "column2"]);

        q.build().must.include('DELETE column1, column2');
    });
});