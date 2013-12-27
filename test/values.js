'use strict';

var demand = require('must');
var fcql = require('../index');

describe('values', function () {
    var query = fcql.insertInto('bla', 'column1');

    it('should write VALUES (...)', function () {
        var q = query.values(1);

        q.build().must.include('INSERT INTO bla (column1) VALUES (1)');
    });

    it('should demand parameters', function () {
        var q = query.values();

        q.build.bind(q).must.throw(/argument/);
    });

    it('should join over comma', function () {
        var q = query.values(1, 'two');

        q.build().must.include('INSERT INTO bla (column1) VALUES (1, "two")');
    });

    it('should accept array', function () {
        var q = query.values([1, 'two']);

        q.build().must.include('INSERT INTO bla (column1) VALUES (1, "two")');
    });

    it('should not accept empty array', function () {
        var q = query.insertInto('tableName', []);

        q.build.bind(q).must.throw(/argument/);
    });

    it('should write IN NOT EXISTS at the end', function () {
        var q = query.values([1, 'two']).ifNotExists();

        q.build().must.include('INSERT INTO bla (column1) VALUES (1, "two") IF NOT EXISTS');
    });
});