'use strict';

var stampit = require('stampit');

/**
 * Appends 'USE keyspace' to the query.
 * @param {string} keyspace - the keyspace to use.
 * @returns {FluentCql}
 */
var use = function use() {
    this._chain.push(arguments.slice());
    return this;
};

exports.use = use;