'use strict';

var demand = require('must');
var fcql = require('../fluent-cql');

describe('where', function () {
    var query;
    beforeEach(function () {
        query = fcql.select('something').from('somewhere');
    });

    it('should allow string', function () {
        query.where('anything here');

        demand(query.err).be.undefined();
    });

    it('should demand argument', function () {
        query.where();

        query.err.must.exist();
        query.err.must.include('argument');
    });

    it('should not non-objects', function () {
        query.where(123);

        query.err.must.exist();
        query.err.must.include('argument');
    });

    it('should not allow empty objects', function () {
        query.where({});

        query.err.must.exist();
        query.err.must.include('property');
    });

    it('should write WHERE', function () {
        query.where({a: 1});

        query.build().must.include('WHERE');
    });

    it('should not allow empty values', function () {
        query.where({a: ''});

        query.err.must.exist();
        query.err.must.include('value');
    });

    it('should not allow undefined values', function () {
        query.where({a: undefined});

        query.err.must.exist();
        query.err.must.include('value');
    });

    it('should indicate wrongful key', function () {
        query.where({myKeyName: ''});

        query.err.must.exist();
        query.err.must.include('myKeyName');
    });

    it('should not alloy empty IN', function () {
        query.where({a: []});

        query.err.must.exist();
        query.err.must.include('value');
    });

    it('should allow only EQ,GT,LT,LE,GE comparators', function () {
        query.where({a: {GT: '0', LTE: '9'}});

        query.err.must.exist();
        query.err.must.include('operator');
    });

    it('should allow only EQ,GT,LT,LE,GE comparators', function () {
        query.where({a: {GT: '0', LTE: '9'}});

        query.err.must.exist();
        query.err.must.include('operator');
    });

    it('should convert date to UTC', function () {
        query.where({a: new Date(3141592653589)});

        query.build().must.include('2069-07-21T00:37:33.589Z');
    });

    it('should forbid different types comparison', function () {
        query.where({a: {GT: new Date(3141592653589), LT: 3.141592653589}});

        query.err.must.exist();
        query.err.must.include('different types');
    });

    it('should not allow different type for IN', function () {
        query.where({a: [1, 2, '']});

        query.err.must.exist();
        query.err.must.include('same type');
    });

    it('should produce IN having all values', function () {
        query.where({a: [1, 2, 3]});

        query.build().must.include('IN (1,2,3)');
    });
});