'use strict';

/**
 * Fluent-CQL module converts your JS fluent syntax to CQL string query.
 * @module fluent-cql
 */

var stampit = require('stampit');
var _ = require('underscore');
var _s = require('underscore.string');
var builder = require('./lib/builder');
var constants = require('./lib/const');

var clausesFactory;
(function createClausesFactory() {
    var clauses = [ 'use', 'create', 'table', 'tableIfNotExists', 'keyspace', 'keyspaceIfNotExists',
        'select', 'selectAll', 'from', 'where', 'with', 'insertInto', 'values', 'ifNotExists', 'insertIntoValues',
        'using', 'delete' ];
    var clausesProto = {
        query: function query(structure) {
            return clausesFactory.state({structure: structure}).create();
        },
        build: builder()
    };
    _.each(clauses, function (clause) {
            clausesProto[clause] = function createClauseStructure() { // TODO: Rethink the naming
                // mix old properties into new structure
                var newStructure = _.extend({}, this.structure);

                // Add the new property to the structure
                newStructure[clause] = arguments.length === 0 ? undefined : [].slice.call(arguments);

                return clausesFactory.create({structure: newStructure});
            };
        },
        this);
    clausesFactory = stampit(clausesProto);
}());

var exportObject = clausesFactory.create();
stampit.extend(exportObject, constants.cqlTypes(), constants.cqlReplicationStrategies(), constants.consistencyValues());
Object.freeze(exportObject);
Object.freeze(exportObject.strategy);
Object.freeze(exportObject.consistency);

/**
 * @readonly
 * @prop {string} ascii -       CQL 'ascii' type.
 * @prop {string} bigint -      CQL 'bigint' type.
 * @prop {string} blob -        CQL 'blob' type.
 * @prop {string} boolean -     CQL 'boolean' type.
 * @prop {string} counter -     CQL 'counter' type.
 * @prop {string} decimal -     CQL 'decimal' type.
 * @prop {string} double -      CQL 'double' type.
 * @prop {string} float -       CQL 'float' type.
 * @prop {string} inet -        CQL 'inet' type.
 * @prop {string} int -         CQL 'int' type.
 * @prop {string} text -        CQL 'text' type.
 * @prop {string} timestamp -   CQL 'timestamp' type.
 * @prop {string} timeuuidl -   CQL 'timeuuidl' type (same as timeuuid).
 * @prop {string} timeuuid -    CQL 'timeuuid' type.
 * @prop {string} uuid -        CQL 'uuid' type.
 * @prop {string} varchar -     CQL 'varchar' type.
 * @prop {string} varint -      CQL 'varint' type.
 */
module.exports = exportObject;
