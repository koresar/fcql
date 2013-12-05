'use strict';

var fcql = require('../fluent-cql');
var _ = require('underscore');

describe('fcql', function () {
    it('should contain all 16 CQL types', function () {
        var types = [
            'ascii', 'bigint', 'blob', 'boolean', 'counter', 'decimal', 'double', 'float',
            'inet', 'int', 'text', 'timestamp', 'timeuuidl', 'uuid', 'varchar', 'varint'
        ];
        _.difference(types, _.keys(fcql)).must.be.empty();
    });
});