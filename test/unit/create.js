'use strict';

var demand = require('must');
var _s = require('underscore.string');
var fcql = require('../../index');

describe('create if not exists', function () {
    var query;
    beforeEach(function () {
        query = fcql.create();
    });

    it('should write TABLE IF NOT EXISTS', function () {
        var q = query.tableIfNotExists('tableName', {a: 'int', PRIMARY_KEY: 'a'});

        q.build().must.include('TABLE IF NOT EXISTS');
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
        var q = query.create();

        oldMsg.must.not.equal(q.err);
    });

    it('should write CREATE', function () {
        query.build().must.include('CREATE');
    });

    describe('table', function () {
        beforeEach(function () {
            query = fcql.create();
        });

        it('should write CREATE TABLE', function () {
            var q = query.table('tableName', {a: 'int', PRIMARY_KEY: 'a'});

            q.build().must.include('CREATE TABLE');
        });

        it('should validate column types', function () {
            var q = query.table('tableName', {a: 'text', b: 'string', PRIMARY_KEY: ['a', 'b']});

            q.build.bind(q).must.throw(/types/);
        });

        it('should require table name', function () {
            var q = query.table(' ');

            q.build.bind(q).must.throw(/table name/);
        });

        it('should require table columns', function () {
            var q = query.table('tableName', {});

            q.build.bind(q).must.throw(/columns/);
        });

        it('should insist on PRIMARY KEY', function () {
            var q = query.table('tableName', {a: 'timestamp'});

            q.build.bind(q).must.throw(/PRIMARY KEY/);
        });

        it('should not allow unknown columns in PRIMARY KEY', function () {
            var q = query.table('tableName', {a: 'float', PRIMARY_KEY: ['a', 'b']});

            q.build.bind(q).must.throw(/PRIMARY KEY/);
        });

        it('should build correct PRIMARY KEY', function () {
            var q = query.table('tableName', {a: 'double', b: 'text', PRIMARY_KEY: ['a', 'b']});

            q.build().must.contain('PRIMARY KEY (a, b)');
        });

        it('should put semicolon at the end', function () {
            var q = query.table('tableName', {a: 'double', b: 'text', PRIMARY_KEY: ['a', 'b']});

            demand(_s.endsWith(q.build(), ';'));
        });
    });

    describe('keyspace', function () {
        beforeEach(function () {
            query = fcql.create();
        });

        it('should write CREATE KEYSPACE ...', function () {
            var q = query.keyspace('keyspaceName');

            q.build().must.be(
                "CREATE KEYSPACE keyspaceName WITH replication = {'class':'SimpleStrategy','replication_factor':'3'};");
        });

        it('should require keyspace name', function () {
            var q = query.keyspace(' ');

            q.build.bind(q).must.throw(/keyspace name/);
        });

        it('should not require replication', function () {
            var q = query.keyspace('keyspaceName');

            q.build().must.include('replication');
            q.build().must.include('class');
            q.build().must.include('replication_factor');
        });

        it('should allow empty replication object', function () {
            var q = query.keyspace('keyspaceName', {});

            q.build().must.include('replication');
            q.build().must.include('class');
            q.build().must.include('replication_factor');
        });

        it('should allow partial replication object', function () {
            var q = query.keyspace('keyspaceName', {replication_factor: 1});

            q.build().must.include('replication');
            q.build().must.include('class');
            q.build().must.include('replication_factor');
        });

        it('should write durable_writes if given', function () {
            var q = query.keyspace('keyspaceName', null, true);

            q.build().must.include('durable_writes');
        });

        it('should be able to use namespaced strategy class', function () {
            var q = query.keyspace('keyspaceName', {'class': fcql.strategy.networkTopology});

            q.build().must.include('NetworkTopologyStrategy');
        });

        it('should not allow negative replication_factor', function () {
            var q = query.keyspace('keyspaceName', {replication_factor: -2});

            q.build.bind(q).must.throw(/replication_factor/);
        });

        it('should not allow empty replication_factor', function () {
            var q = query.keyspace('keyspaceName', {replication_factor: ''});

            q.build.bind(q).must.throw(/replication_factor/);
        });

        it('should not allow strange replication_factor', function () {
            var q = query.keyspace('keyspaceName', {replication_factor: []});

            q.build.bind(q).must.throw(/replication_factor/);
        });

        it('should allow unknown replication options', function () {
            var q = query.keyspace('keyspaceName', {'class': 'NonExistent'});

            q.build();

            demand(q.err).be.undefined();
        });

        it('should put semicolon at the end', function () {
            var q = query.keyspace('keyspaceName');

            demand(q.err).be.undefined();
            demand(_s.endsWith(q.build(), ';'));
        });
    });
});