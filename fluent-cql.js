'use strict';

/**
 * Fluent-CQL module converts your JS fluent syntax to CQL string query.
 * @module fluent-cql
 */

var stampit = require('stampit');
var _ = require('underscore');
var _s = require('underscore.string');

function cqlTypes() {
    var types = [
        'ascii', 'bigint', 'blob', 'boolean', 'counter', 'decimal', 'double', 'float',
        'inet', 'int', 'text', 'timestamp', 'timeuuidl', 'uuid', 'varchar', 'varint'
    ];
    return _.object(types, types);
}

function cqlReplicationStrategies() {
    var strategies = ['SimpleStrategy', 'NetworkTopologyStrategy', 'OldNetworkTopologyStrategy'];
    var shortNamedStrategies = _.map(strategies, function (strategy) {
        return _s.strLeftBack(strategy, 'Strategy');
    });
    var obj = _.object(strategies, strategies);
    obj.Strategy = stampit()
        .state(_.object(strategies, strategies))
        .state(_.object(shortNamedStrategies, strategies))
        .create();
    obj.ReplicationStrategy = obj.Strategy;
    return obj;
}

/**
 * Fluent syntax for Cassandra CQL.
 * @constructor
 */
function FluentCql() {
    // TODO: Make this not string but token collection so that actual string created on the build() call only.
    /**
     * This variable collects the query pieces.
     * @type {string}
     */
    var query = '';

    /**
     * Indicates if there were errors while building the string. Contains error message.
     * @type {string}
     */
    this.err = undefined;

    /**
     * Returns the resulting query string, OR error message.
     * @returns {string}
     */
    this.build = function build() {
        var q = _s.isBlank(query) ? ';' : (_s.rtrim(query) + ';');
        return this.err ? (this.err + (_s.isBlank(query) ? '' : _s.quote(query + '???'))) : q;
    };

    /**
     * Marks this object as malformed, sets the error message. As the result no any further object building possible.
     * @param {string} str -
     * @returns {FluentCql}
     * @private
     */
    this.setError = function setError(str) {
        // TODO: DRY this if
        if (this.err) {
            return this;
        }
        this.err = _s.surround(str, ' (!) ');
        return this;
    };

    /**
     * Appends the given string to the end of the query.
     * @param {string} str - string to append.
     * @returns {FluentCql}
     */
    this.concat = function concat(str) {
        if (this.err) {
            return this;
        }
        query += str;
        return this;
    };

    /**
     * Appends the given string and a trailing space to the end of the query.
     * @param {string} str - string to append.
     * @returns {FluentCql}
     */
    this.concat_ = function concat_(str) {
        if (this.err) {
            return this;
        }
        return this.concat(str + ' ');
    };

    /**
     * Appends 'USE keyspace' to the query.
     * @param {string} keyspace - the keyspace to use.
     * @returns {FluentCql}
     */
    this.use = function use(keyspace) {
        if (this.err) {
            return this;
        }

        return this.concat_('USE')._validateKeyspaceName(keyspace, 'USE').concat_(keyspace);
    };

    /**
     * Appends 'SELECT ... ' to the query.
     * @param {(...string|string[])} columns - columns to retrieve.
     * @returns {FluentCql}
     */
    this.select = function select(columns) {
        if (this.err) {
            return this;
        }

        var args = _.compact(arguments);
        if (args.length === 0 || args[0].length === 0) {
            return this.setError('argument(s) missing in SELECT');
        }

        this.concat_('SELECT');
        if (_.all(args, _.isString)) {
            return this.concat_(args.join(', '));
        }
        if (_.isArray(args[0])) {
            return this.concat_(args[0].join(', '));
        }

        return this.setError('argument(s) must be string in SELECT');
    };

    /**
     * Appends 'SELECT * ' to the query.
     * @returns {FluentCql}
     */
    this.selectAll = function selectAll() {
        return this.select('*');
    };

    /**
     * Appends 'FROM table_name ' to the query.
     * @param {string} tableName - the table to read data from.
     * @returns {FluentCql}
     */
    this.from = function from(tableName) {
        if (this.err) {
            return this;
        }

        return this.concat_('FROM')._validateTableName(tableName, 'FROM').concat_(tableName);
    };

    /**
     * Appends 'WHERE ...' clause to the query.
     * @param {(object|string)} params - a fluent-object 'where' clause or a string.
     * @returns {FluentCql}
     */
    this.where = function where(params) {
        if (this.err) {
            return this;
        }
        if (!params) {
            return this.setError('argument missing in WHERE');
        }
        if (_.isString(params)) {
            return this.concat_(params);
        }

        if (!_.isObject(params)) {
            return this.setError('argument wrong in WHERE');
        }

        var keyValuePairs = _.pairs(params);
        if (keyValuePairs.length === 0) {
            return this.setError('object property(-ies) missing in WHERE');
        }

        this.concat_('WHERE');

        var clauses = _.map(
            keyValuePairs,
            function (keyValuePair) {
                if (this.err) {
                    return this;
                }
                var key = keyValuePair[0],
                    value = keyValuePair[1];
                if (!value) {
                    return this.setError('value missing for key ' + key + ' in WHERE');
                }

                if (_.isString(value)) {
                    if (value.length === 0) {
                        return this.setError('value missing for key ' + key + ' in WHERE');
                    }

                    return [key, '=', JSON.stringify(value)].join(' ');
                }
                else if (_.isDate(value)) {
                    // Lucky us the JSON.stringify(Date) produces UTC time. Otherwise we would have to adopt it for C*.
                    return [key, '=', JSON.stringify(value)].join(' ');
                }
                else if (_.isArray(value)) {
                    if (value.length === 0) {
                        return this.setError('value missing for key ' + key + ' in WHERE');
                    }
                    if (_.any(value, function (item) {
                        return typeof value[0] !== typeof item;
                    })) {
                        return this.setError('values must be of the same type for key ' + key + ' in WHERE');
                    }

                    return [key, 'IN', '(' + _.map(value, JSON.stringify).join() + ')'].join(' ');
                } else if (_.isObject(value)) {
                    var operators = _.pairs(value),
                        conditionOps = {
                            EQ: '=',
                            GT: '>',
                            LT: '<',
                            GE: '>=',
                            LE: '<='
                        };

                    if (operators.length < 1 || operators.length > 2 || !_.contains(_.keys(conditionOps), _s.capitalize(operators[0][0])) ||
                        (operators.length === 2 && !_.contains(_.keys(conditionOps), _s.capitalize(operators[1][0])))) {
                        return this.setError('there must be 1 or 2 relational operator (EQ,GT,LT,LE,GE) for key ' + key + ' in WHERE');
                    }

                    var clause = [key, conditionOps[operators[0][0]], JSON.stringify(operators[0][1])];
                    if (operators.length === 2) {
                        if (typeof operators[0][1] !== typeof operators[1][1]) {
                            this.setError('comparing values of different types for key ' + key + ' in WHERE');
                        }

                        clause.push('AND');
                        clause = clause.concat([key, conditionOps[operators[1][0]], JSON.stringify(operators[1][1])]);
                    }

                    return clause.join(' ');
                }
                else {
                    return [key, '=', JSON.stringify(value)].join(' ');
                }
            },
            this
        );

        if (this.err) {
            return this;
        }

        return this.concat_(clauses.join(' AND '));
    };

    /**
     * Appends 'CREATE ' to the query.
     * @returns {FluentCql}
     */
    this.create = function create() {
        return this.concat_('CREATE');
    };

    /**
     * Appends keyspace description 'KEYSPACE name WITH ...' to the query.
     * @param {string} ks - keyspace name.
     * @param {object} [replication='{'class': 'SimpleStrategy', 'replication_factor': '3'}'] - replication strategy options.
     * See {@link http://cassandra.apache.org/doc/cql3/CQL.html#createKeyspaceStmt}
     * @param {bool} [durableWrites=] - durable writes boolean. Uses CQL default 'true' if not present.
     * See {@link http://cassandra.apache.org/doc/cql3/CQL.html#createKeyspaceStmt}
     * @returns {FluentCql}
     */
    this.keyspace = function keyspace(ks, replication, durableWrites) {
        if (this.err) {
            return this;
        }

        return this.concat_('KEYSPACE')._keyspace(ks, replication, durableWrites);
    };

    /**
     * Appends keyspace description 'KEYSPACE IN NOT EXISTS name WITH ...' to the query.
     * @param {string} ks - keyspace name.
     * @param {object} [replication='{'class': 'SimpleStrategy', 'replication_factor': '3'}'] - replication strategy options.
     * See {@link http://cassandra.apache.org/doc/cql3/CQL.html#createKeyspaceStmt}
     * @param {bool} [durableWrites=] - durable writes boolean. CQL defaults to 'true' if not present.
     * See {@link http://cassandra.apache.org/doc/cql3/CQL.html#createKeyspaceStmt}
     * @returns {FluentCql}
     */
    this.keyspaceIfNotExists = function keyspaceIfNotExists(ks, replication, durableWrites) {
        if (this.err) {
            return this;
        }

        return this.concat_('KEYSPACE').concat_('IF NOT EXISTS')._keyspace(ks, replication, durableWrites);
    };

    this._keyspace = function _keyspace(ks, replication, durableWrites) {
        return this._validateKeyspaceName(ks, 'KEYSPACE').concat_(ks).concat(this._keyspaceOptions(replication, durableWrites));
    };

    this._keyspaceOptions = function _keyspaceOptions(replication, durableWrites) {
        if (this.err) {
            return this;
        }

        this.concat_('WITH').concat_('replication =');

        if (!replication || _.isEmpty(replication)) {
            replication = this._defaultReplicationOptions();
        }
        else {
            if (!replication['class']) {
                replication['class'] = this._defaultReplicationOptions()['class'];
            }
            else if (!_.has(cqlReplicationStrategies().Strategy, replication['class'])) {
                return this.setError('unknown replication strategy class ' + replication['class'] + ' in KEYSPACE');
            }
            if (_.isUndefined(replication.replication_factor)) {
                replication.replication_factor = this._defaultReplicationOptions().replication_factor;
            }
            else {
                var factor = replication.replication_factor;
                if (_.isString(factor)) {
                    factor = _s.toNumber(replication.replication_factor);
                }

                if (_.isNaN(factor) || !_.isNumber(factor) || factor <= 0) {
                    return this.setError('replication_factor must be positive int in KEYSPACE');
                }
            }
        }

        this.concat_(JSON.stringify(replication));
        if (!_.isUndefined(durableWrites)) {
            this.concat('AND').concat_('durable_writes =').concat_(durableWrites.toString());
        }

        return this;
    };

    this._defaultReplicationOptions = function _defaultReplicationOptions() {
        return {'class': 'SimpleStrategy', 'replication_factor': '3'};
    };

    /**
     * Appends table description 'TABLE name (key type, ...)' to the query.
     * @param {(string)} name - the table name.
     * @param {(object|string)} columns - a fluent-object clause describing table columns or a string.
     * @returns {FluentCql}
     */
    this.table = function table(name, columns) {
        return this.concat_('TABLE')._table(name, columns);
    };

    /**
     * Appends table description 'TABLE IF NOT EXISTS name (key type, ...)' to the query.
     * @param {(string)} name - the table name.
     * @param {(object|string)} columns - a fluent-object clause describing table columns or a string.
     * @returns {FluentCql}
     */
    this.tableIfNotExists = function tableIfNotExists(name, columns) {
        return this.concat_('TABLE').concat_('IF NOT EXISTS')._table(name, columns);
    };

    this._table = function _table(name, columns) {
        return this._validateTableName(name, 'TABLE').concat_(name).concat('(')._columns(columns).concat_(')');
    };

    this._columns = function _columns(columns) {
        if (this.err) {
            return this;
        }
        if (!columns || _.isEmpty(columns)) {
            return this.setError('table columns are missing in TABLE');
        }
        if (_.isString(columns)) {
            return this.concat_(columns);
        }

        var validCqlTypes = cqlTypes();
        var keyValuePairs = _.pairs(columns);
        var primaryKey = _.last(keyValuePairs);
        if (primaryKey[0] !== 'PRIMARY_KEY') {
            return this.setError('PRIMARY_KEY must be last in TABLE');
        }

        var columnKeys = _.head(_.keys(columns), keyValuePairs.length - 1);
        var columnValues = _.head(_.values(columns), keyValuePairs.length - 1);

        if (_.difference(columnValues, _.values(validCqlTypes)).length > 0) {
            return this.setError('use valid cql types while declaring columns in TABLE');
        }

        var primaryKeyContents = primaryKey[1];
        if (!_.isString(primaryKeyContents)) {
            if (!_.isArray(primaryKeyContents) || primaryKeyContents.length === 0) {
                return this.setError('PRIMARY_KEY not found in TABLE');
            }
            var usedColumns = _.flatten(primaryKeyContents);
            var unknownColumns = _.difference(usedColumns, columnKeys);
            if (!_.all(usedColumns, _.isString) || unknownColumns.length > 0) {
                return this.setError('PRIMARY_KEY contains unknown columns ' + unknownColumns.join() + ' in TABLE');
            }
            if (_.isArray(primaryKeyContents[0])) {
                primaryKeyContents[0] = '(' + primaryKeyContents[0].join(', ') + ')';
            }

            primaryKey[1] = '(' + primaryKeyContents.join(', ') + ')';
        }

        var clauses = _.map(keyValuePairs, function (pair) {
            return pair[0] + ' ' + pair[1];
        });

        return this.concat(clauses.join(', '));
    };

    this._validateTableName = function _validateTableName(name, disposition) {
        if (!name || !_.isString(name) || _s.isBlank(name) || _s.include(name, ' ')) {
            return this.setError('table name must be valid in ' + disposition);
        }
        return this;
    };

    this._validateKeyspaceName = function _validateKeyspaceName(name, disposition) {
        if (!name || !_.isString(name) || _s.isBlank(name) || _s.include(name, ' ')) {
            return this.setError('keyspace name must be valid in ' + disposition);
        }
        return this;
    };
}

function cqlQueries() {
    var obj = {};
    // This list of FluentCql class functions will be reused and delegated to.
    _.each(['use', 'select', 'selectAll', 'create'],
        function (name) {
            obj[name] = function () {
                // Create new instance of the object each time.
                var fluentCql = new FluentCql();
                // Invoke the object's function.
                return fluentCql[name].apply(fluentCql, arguments);
            };
        });
    return obj;
}

/**
 * @readonly
 * @enum {string} ascii -       CQL 'ascii' type.
 * @enum {string} bigint -      CQL 'bigint' type.
 * @enum {string} blob -        CQL 'blob' type.
 * @enum {string} boolean -     CQL 'boolean' type.
 * @enum {string} counter -     CQL 'counter' type.
 * @enum {string} decimal -     CQL 'decimal' type.
 * @enum {string} double -      CQL 'double' type.
 * @enum {string} float -       CQL 'float' type.
 * @enum {string} inet -        CQL 'inet' type.
 * @enum {string} int -         CQL 'int' type.
 * @enum {string} text -        CQL 'text' type.
 * @enum {string} timestamp -   CQL 'timestamp' type.
 * @enum {string} timeuuidl -   CQL 'timeuuidl' type.
 * @enum {string} uuid -        CQL 'uuid' type.
 * @enum {string} varchar -     CQL 'varchar' type.
 * @enum {string} varint -      CQL 'varint' type.
 */
module.exports = stampit().state(cqlQueries()).state(cqlTypes()).state(cqlReplicationStrategies()).create();