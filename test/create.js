'use strict';

var demand = require('must');
var _s = require('underscore.string');
var fcql = require('../fluent-cql');


describe('create if not exists', function () {
    var query;
    beforeEach(function () {
        query = fcql.create();
    });

    it('should write TABLE IF NOT EXISTS', function () {
        query.tableIfNotExists('tableName', {a: 'int', PRIMARY_KEY: 'a'});

        query.build().must.include('TABLE IF NOT EXISTS');
    });
});

describe('create', function () {
    var query;
    beforeEach(function () {
        query = fcql.create();
    });

    it('should create new instance', function () {
        var oldMsg = "instance 1";
        query.err = oldMsg;
        query = fcql.create();

        oldMsg.must.not.equal(query.err);
    });

    it('should write CREATE', function () {
        query.build().must.include('CREATE');
    });

    describe('table', function () {
        beforeEach(function () {
            query = fcql.create();
        });

        it('should write CREATE TABLE', function () {
            query.table('tableName', {a: 'int', PRIMARY_KEY: 'a'});

            query.build().must.include('CREATE TABLE');
        });

        it('should validate column types', function () {
            query.table('tableName', {a: 'text', b: 'string', PRIMARY_KEY: ['a', 'b']});

            query.err.must.exist();
            query.err.must.include('types');
        });

        it('should require table name', function () {
            query.table(' ');

            query.err.must.exist();
            query.err.must.include('table name');
        });

        it('should require table columns', function () {
            query.table('tableName', {});

            query.err.must.exist();
            query.err.must.include('columns');
        });

        it('should insist on PRIMARY_KEY', function () {
            query.table('tableName', {a: 'timestamp'});

            query.err.must.exist();
            query.err.must.include('PRIMARY_KEY');
        });

        it('should not allow unknown columns in PRIMARY_KEY', function () {
            query.table('tableName', {a: 'float', PRIMARY_KEY: ['a', 'b']});

            query.err.must.exist();
            query.err.must.include('PRIMARY_KEY');
        });

        it('should put semicolon at the end', function () {
            query.table('tableName', {a: 'double', b: 'text', PRIMARY_KEY: ['a', 'b']});

            demand(query.err).be.undefined();
            demand(_s.endsWith(query.build(), ';'));
        });
    });
});