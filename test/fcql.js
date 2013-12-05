'use strict';

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
});