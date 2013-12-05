var assert = require('assert');
var fcql = require('../fluent-cql');
var _ = require('underscore');
var _s = require('underscore.string');

describe('fcql', function () {
    it('should contain all 16 CQL types', function () {
        var types = [
            'ascii', 'bigint', 'blob', 'boolean', 'counter', 'decimal', 'double', 'float',
            'inet', 'int', 'text', 'timestamp', 'timeuuidl', 'uuid', 'varchar', 'varint'
        ];
        assert.equal(_.difference(types, _.keys(fcql)).length, 0);
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

                assert.notEqual(oldMsg, query.err);
            });

            it('should write CREATE', function () {
                assert(_s.startsWith(query.toString(), 'CREATE'));
            });

            describe('table', function () {
                beforeEach(function () {
                    query = fcql.create();
                });

                it('should write CREATE TABLE', function () {
                    query.table('tableName', {a: 'int', PRIMARY_KEY: 'a'});
                    assert(_s.startsWith(query.toString(), 'CREATE TABLE'));
                });

                it('should validate column types', function () {
                    query.table('tableName', {a: 'text', b: 'string', PRIMARY_KEY: ['a', 'b']});

                    assert(query.err, query.err);
                    assert(_s.contains(query.err, 'types'), query.err);
                });

                it('should require table name', function () {
                    query.table(' ');

                    assert(query.err, query.err);
                    assert(_s.contains(query.err, 'table name'));
                });

                it('should require table columns', function () {
                    query.table('tableName', {});

                    assert(query.err, query.err);
                    assert(_s.contains(query.err, 'columns'));
                });

                it('should insist on PRIMARY_KEY', function () {
                    query.table('tableName', {a: 'timestamp'});

                    assert(query.err, query.err);
                    assert(_s.contains(query.err, 'PRIMARY_KEY'));
                });

                it('should not allow unknown columns in PRIMARY_KEY', function () {
                    query.table('tableName', {a: 'float', PRIMARY_KEY: ['a', 'b']});

                    assert(query.err, query.err);
                    assert(_s.contains(query.err, 'PRIMARY_KEY'));
                });

                it('should put semicolon at the end', function () {
                    query.table('tableName', {a: 'double', b: 'text', PRIMARY_KEY: ['a', 'b']});

                    assert(!query.err, query.err);
                    assert(_s.endsWith(query.toString(), ';'));
                });
            });



        }
    );
});