'use strict';

var demand = require('must');
var fcql = require('../index');

describe('insert', function () {
    var query = fcql;

    it('should write INSERT INTO tableName', function () {
        var q = query.insertInto('bla', 'column1');

        q.build().must.include('INSERT INTO bla');
    });

    it('should demand parameters', function () {
        var q = query.insertInto();

        q.build.bind(q).must.throw(/argument/);
    });

    it('should demand valid table name', function () {
        var q = query.insertInto('tableName', {a: 1});

        q.build.bind(q).must.throw(/column name/);
    });

    it('should demand valid parameters', function () {
        var q = query.insertInto({a: 1});

        q.build.bind(q).must.throw(/table name/);
    });

    it('should join over comma', function () {
        var q = query.insertInto('tableName', 'one', 'two');

        q.build().must.include('INSERT INTO tableName (one, two)');
    });

    it('should accept array', function () {
        var q = query.insertInto('tableName', ['one', 'two']);

        q.build().must.include('INSERT INTO tableName (one, two)');
    });

    it('should not accept empty array', function () {
        var q = query.insertInto('tableName', []);

        q.build.bind(q).must.throw(/argument/);
    });

    it('should not accept many string arguments', function () {
        var q = query.insertInto('tableName', 'one', 'two');

        q.build().must.include('INSERT INTO tableName (one, two)');
    });
});