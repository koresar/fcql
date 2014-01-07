'use strict';

var demand = require('must');
var fcql = require('../index');

describe('using', function () {
    it('should not allow incorrect argument types', function () {
        var q1 = fcql.using(1);
        var q2 = fcql.using(true);
        var q3 = fcql.using([1, 2]);

        q1.build.bind(q1).must.throw(/argument/);
        q2.build.bind(q1).must.throw(/argument/);
        q3.build.bind(q1).must.throw(/argument/);
    });

    it('should allow string argument', function () {
        var q = fcql.using('any string here');

        q.build().must.include('any string here');
    });

    it('should build proper', function () {
        var q = fcql.using({CONSISTENCY: fcql.consistency.localQuorum, TTL: 12344321});

        q.build().must.include('USING CONSISTENCY LOCAL_QUORUM AND TTL 12344321');
    });
});