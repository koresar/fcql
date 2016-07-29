'use strict';

var fcql = require('../../index');
var _ = require('underscore');
var demand = require('must');

describe('fcql', function () {
    it('should contain all 16 CQL types', function () {
        var types = [
            'ascii', 'bigint', 'blob', 'boolean', 'counter', 'decimal', 'double', 'float',
            'inet', 'int', 'text', 'timestamp', 'timeuuidl', 'timeuuid', 'uuid', 'varchar', 'varint'
        ];
        _.difference(types, _.keys(fcql)).must.be.empty();
    });

    it('should exist namespaced strategies ', function () {
        demand(fcql.strategy).must.exist();
        demand(fcql.strategy.simple).must.exist();
        demand(fcql.strategy.networkTopology).must.exist();
        demand(fcql.strategy.oldNetworkTopology).must.exist();
    });

    it('should create new instances all the time', function () {
        var obj1 = fcql.selectAll();
        var obj2 = obj1.from('tableName');

        obj1.must.not.equal(obj2);
    });

    it('should not allow constants change', function () {
        function firstLevel() { fcql.int = "anything else"; }
        function secondLevel() { fcql.strategy.simple = "anything else"; }
        function thirdLevel() { fcql.consistency.one = "anything else"; }

        firstLevel.must.throw(/read only/);
        secondLevel.must.throw(/read only/);
        thirdLevel.must.throw(/read only/);
    });
});
