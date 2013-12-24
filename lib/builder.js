'use strict';

var fluentCql = require('./fluent-cql');
var _ = require('underscore');
var _s = require('underscore.string');

module.exports = function builder() {
    return function build() {
        var fcql = new fluentCql();
        _.each(_.pairs(this.structure), function (pair) {
            if (fcql.err) {
                return;
            }

            var clause = pair[0];
            var args = pair[1];
            fcql[clause].apply(fcql, args);
        });
        return fcql.build();
    };
};