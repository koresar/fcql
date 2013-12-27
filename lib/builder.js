'use strict';

var fluentCql = require('./fluent-cql');
var _ = require('underscore');
var _s = require('underscore.string');

module.exports = function builder() {
    return function build() {
        var builder = new fluentCql();
        _.each(_.pairs(this.structure), function (pair) {
            if (builder.err) {
                return;
            }

            var clause = pair[0];
            var args = pair[1];
            builder[clause].apply(builder, args);
        });
        return builder.build();
    };
};