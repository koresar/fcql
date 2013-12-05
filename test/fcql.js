'use strict';

var demand = require('must');
var fcql = require('../fluent-cql');
var _ = require('underscore');
var _s = require('underscore.string');

describe('fcql', function () {
    it('should contain all 16 CQL types', function () {
        var types = [
            'ascii', 'bigint', 'blob', 'boolean', 'counter', 'decimal', 'double', 'float',
            'inet', 'int', 'text', 'timestamp', 'timeuuidl', 'uuid', 'varchar', 'varint'
        ];
        _.difference(types, _.keys(fcql)).must.be.empty();
    });
});