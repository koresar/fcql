'use strict';

var fcql = require('../fluent-cql');

describe('selectAll', function () {
    var query;
    beforeEach(function () {
        query = fcql.selectAll();
    });

    it('should create new instance', function () {
        var oldMsg = "instance 1";
        query.err = oldMsg;
        query = fcql.selectAll();

        oldMsg.must.not.equal(query.arr);
    });

    it('should write SELECT *', function () {
        query.build().must.include('SELECT *');
    });
});

describe('select', function () {
    var query;

    it('should write SELECT tableName', function () {
        query = fcql.select('bla');

        query.build().must.include('SELECT bla');
    });

    it('should demand parameters', function () {
        query = fcql.select();

        query.err.must.exist();
        query.err.must.include('argument');
    });

    it('should demand valid parameters', function () {
        query = fcql.select({a: 1});

        query.err.must.exist();
        query.err.must.include('argument');
        query.err.must.include('string');
    });

    it('should join over comma', function () {
        query = fcql.select('one', 'two');

        query.build().must.include('SELECT one, two');
    });

    it('should accept array', function () {
        query = fcql.select(['one', 'two']);

        query.build().must.include('SELECT one, two');
    });

    it('should not accept empty array', function () {
        query = fcql.select([]);

        query.err.must.exist();
        query.err.must.include('argument');
    });
});