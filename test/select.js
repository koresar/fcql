'use strict';

var fcql = require('../index');

describe('selectAll', function () {
    var query = fcql;
    var q;
    beforeEach(function () {
        q = query.selectAll();
    });

    it('should create new instance', function () {
        var oldMsg = "instance 1";
        query.err = oldMsg;
        var q = query.selectAll();

        oldMsg.must.not.equal(q.err);
    });

    it('should write SELECT *', function () {
        q.build().must.include('SELECT *');
    });
});

describe('select', function () {
    var query = fcql;

    it('should write SELECT tableName', function () {
        var q = query.select('bla');

        q.build().must.include('SELECT bla');
    });

    it('should demand parameters', function () {
        var q = query.select();

        q.build.bind(q).must.throw(/argument/);
    });

    it('should demand valid parameters', function () {
        var q = query.select({a: 1});

        q.build.bind(q).must.throw(/column name/);
        q.build.bind(q).must.throw(/string/);
    });

    it('should join over comma', function () {
        var q = query.select('one', 'two');

        q.build().must.include('SELECT one, two');
    });

    it('should accept array', function () {
        var q = query.select(['one', 'two']);

        q.build().must.include('SELECT one, two');
    });

    it('should not accept empty array', function () {
        var q = query.select([]);

        q.build.bind(q).must.throw(/argument/);
    });
});