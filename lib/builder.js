'use strict';

var FluentCql = require('./fluent-cql');
var _ = require('underscore');

module.exports = function builder() {
    return function build() {
        var builder = new FluentCql();
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