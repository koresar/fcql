'use strict';

var assert = require('assert');
var fcql = require('../fluent-cql');
var _ = require('underscore');
var _s = require('underscore.string');

describe('fcql', function () {
    describe('selectAll', function () {
        var query;
        beforeEach(function () {
            query = fcql.selectAll();
        });

        it('should create new instance', function () {
            var oldMsg = "instance 1";
            query.err = oldMsg;
            query = fcql.selectAll();

            assert.notEqual(oldMsg, query.err);
        });

        it('should write SELECT', function () {
            assert(_s.startsWith(query.toString(), 'SELECT *'));
        });
    });

    describe('select', function () {
        var query;

        it('should write CREATE TABLE', function () {
            query = fcql.select('bla');

            assert(_s.startsWith(query.toString(), 'SELECT bla'), query.err);
        });
    });
});