'use strict';

var demand = require('must');
var fcql = require('../../index');

describe('where', function () {
    var query;
    beforeEach(function () {
        query = fcql.select('something').from('somewhere');
    });

    it('should allow string', function () {
        var q = query.where('anything here');
        q.build();

        demand(query.err).be.undefined();
    });

    it('should demand argument', function () {
        var q = query.where();

        q.build.bind(q).must.throw(/argument/);
    });

    it('should not non-objects', function () {
        var q = query.where(123);

        q.build.bind(q).must.throw(/argument/);
    });

    it('should not allow empty objects', function () {
        var q = query.where({});

        q.build.bind(q).must.throw(/property/);
    });

    it('should write WHERE', function () {
        var q = query.where({a: 1});

        q.build().must.include('WHERE');
    });

    it('should not allow empty values', function () {
        var q = query.where({a: ''});

        q.build.bind(q).must.throw(/value/);
    });

    it('should not allow undefined values', function () {
        var q = query.where({a: undefined});

        q.build.bind(q).must.throw(/value/);
    });

    it('should indicate wrongful key', function () {
        var q = query.where({myKeyName: ''});

        q.build.bind(q).must.throw(/myKeyName/);
    });

    it('should not alloy empty IN', function () {
        var q = query.where({a: []});

        q.build.bind(q).must.throw(/value/);
    });

    it('should allow only EQ,GT,LT,LE,GE comparators', function () {
        var q = query.where({a: {GT: '0', LTE: '9'}});

        q.build.bind(q).must.throw(/operator/);
    });

    it('should allow only EQ,GT,LT,LE,GE comparators', function () {
        var q = query.where({a: {GT: '0', LTE: '9'}});

        q.build.bind(q).must.throw(/operator/);
    });

    it('should convert date to UTC', function () {
        var q = query.where({a: new Date(3141592653589)});

        q.build().must.include('2069-07-21T00:37:33.589Z');
    });

    it('should forbid different types comparison', function () {
        var q = query.where({a: {GT: new Date(3141592653589), LT: 3.141592653589}});

        q.build.bind(q).must.throw(/different types/);
    });

    it('should not allow different type for IN', function () {
        var q = query.where({a: [1, 2, '']});

        q.build.bind(q).must.throw(/same type/);
    });

    it('should produce IN having all values', function () {
        var q = query.where({a: [1, 2, 3]});

        q.build().must.include('IN (1, 2, 3)');
    });
});