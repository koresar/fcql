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
    return { Strategy: _.object(shortNamedStrategies, strategies) };
}

function primaryKey() {
    return {
        propName: 'PRIMARY_KEY',
        cqlText: 'PRIMARY KEY'
    };
}

function consistency() {
    return {
        propName: 'CONSISTENCY',
        cqlText: 'CONSISTENCY'
    };
}

function consistencyValues() {
    return {
        consistency: {
            any: 'ANY',
            one: 'ONE',
            two: 'TWO',
            three: 'THREE',
            quorum: 'QUORUM',
            localQuorum: 'LOCAL_QUORUM',
            localOne: 'LOCAL_ONE',
            eachQuorum: 'EACH_QUORUM',
            all: 'ALL',
            serial: 'SERIAL'
        }
    };
}

module.exports = stampit({
    cqlTypes: cqlTypes,
    cqlReplicationStrategies: cqlReplicationStrategies,
    primaryKey: primaryKey,
    consistencyValues: consistencyValues
}).create();