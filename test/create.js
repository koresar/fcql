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


    describe('keyspace', function () {
        beforeEach(function () {
            query = fcql.create();
        });

        it('should write CREATE KEYSPACE', function () {
            query.keyspace('keyspaceName');

            query.build().must.include('CREATE KEYSPACE');
        });

        it('should require keyspace name', function () {
            query.keyspace(' ');

            query.err.must.exist();
            query.err.must.include('keyspace name');
        });

        it('should not require replication', function () {
            query.keyspace('keyspaceName');

            query.build().must.include('replication');
            query.build().must.include('class');
            query.build().must.include('replication_factor');
        });

        it('should allow empty replication object', function () {
            query.keyspace('keyspaceName', {});

            query.build().must.include('replication');
            query.build().must.include('class');
            query.build().must.include('replication_factor');
        });

        it('should allow partial replication object', function () {
            query.keyspace('keyspaceName', {replication_factor: 1});

            query.build().must.include('replication');
            query.build().must.include('class');
            query.build().must.include('replication_factor');
        });

        it('should write durable_writes if given', function () {
            query.keyspace('keyspaceName', null, true);

            query.build().must.include('durable_writes');
        });

        it('should be able to use namespaced strategy class', function () {
            query.keyspace('keyspaceName', {'class': fcql.Strategy.NetworkTopology});

            query.build().must.include('NetworkTopologyStrategy');
        });

        it('should not allow negative replication_factor', function () {
            query.keyspace('keyspaceName', {replication_factor: -2});

            query.err.must.exist();
            query.err.must.include('replication_factor');
        });

        it('should not allow empty replication_factor', function () {
            query.keyspace('keyspaceName', {replication_factor: ''});

            query.err.must.exist();
            query.err.must.include('replication_factor');
        });

        it('should not allow strange replication_factor', function () {
            query.keyspace('keyspaceName', {replication_factor: []});

            query.err.must.exist();
            query.err.must.include('replication_factor');
        });

        it('should not allow unknown replication options', function () {
            query.keyspace('keyspaceName', {'class': 'NonExistent'});

            query.err.must.exist();
            query.err.must.include('replication strategy');
        });

        it('should put semicolon at the end', function () {
            query.keyspace('keyspaceName');

            demand(query.err).be.undefined();
            demand(_s.endsWith(query.build(), ';'));
        });
    });
});