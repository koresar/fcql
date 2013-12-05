'use strict';

var demand = require('must');
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

            oldMsg.must.not.equal(query.arr);
        });

        it('should write SELECT', function () {
            query.toString().must.include('SELECT *');
        });
    });

    describe('select', function () {
        var query;

        it('should write CREATE TABLE', function () {
            query = fcql.select('bla');

            query.toString().must.include('SELECT bla');
        });
    });
});