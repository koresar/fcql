'use strict';

var stampit = require('stampit');
var _ = require('underscore');
var _s = require('underscore.string');

function cqlTypes() {
    var types = [
        'ascii', 'bigint', 'blob', 'boolean', 'counter', 'decimal', 'double', 'float',
        'inet', 'int', 'text', 'timestamp', 'timeuuidl', 'uuid', 'varchar', 'varint'
    ];
    return _.object(types, types);
}

function cqlReplicationStrategies() {
    var strategies = ['SimpleStrategy', 'NetworkTopologyStrategy', 'OldNetworkTopologyStrategy'];
    var shortNamedStrategies = _.map(strategies, function (strategy) {
        return _s.strLeftBack(strategy, 'Strategy');
    });
    var obj = _.object(strategies, strategies);
    obj.Strategy = stampit()
        .state(_.object(strategies, strategies))
        .state(_.object(shortNamedStrategies, strategies))
        .create();
    obj.ReplicationStrategy = obj.Strategy;
    return obj;
}

function primaryKey() {
    return {
        propName: 'PRIMARY_KEY',
        cqlText : 'PRIMARY KEY'
    };
}

module.exports = stampit().methods({
    cqlTypes: cqlTypes,
    cqlReplicationStrategies: cqlReplicationStrategies,
    primaryKey: primaryKey
}).create();