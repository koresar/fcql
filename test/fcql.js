'use strict';

var fcql = require('../index');
var _ = require('underscore');
var demand = require('must');

describe('fcql', function () {
    it('should contain all 16 CQL types', function () {
        var types = [
            'ascii', 'bigint', 'blob', 'boolean', 'counter', 'decimal', 'double', 'float',
            'inet', 'int', 'text', 'timestamp', 'timeuuidl', 'uuid', 'varchar', 'varint'
        ];
        _.difference(types, _.keys(fcql)).must.be.empty();
    });

    it('should exist namespaced strategies ', function () {
        demand(fcql.SimpleStrategy).must.exist();
        demand(fcql.Strategy).must.exist();
        demand(fcql.Strategy.SimpleStrategy).must.exist();
        demand(fcql.Strategy.Simple).must.exist();
        demand(fcql.ReplicationStrategy.SimpleStrategy).must.exist();
        demand(fcql.ReplicationStrategy.Simple).must.exist();
    });
});