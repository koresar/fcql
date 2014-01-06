'use strict';

/**
 * Fluent-CQL module converts your JS fluent syntax to CQL string query.
 * @module fluent-cql
 */

var stampit = require('stampit');
var _ = require('underscore');
var _s = require('underscore.string');
var constants = require('./const');

/**
 * Fluent syntax for Cassandra CQL.
 * @param {bool} validate - should only validate data and return error text if any, OTHERWISE throws exception.
 * @constructor
 */
function FluentCql(validate) {
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
     * Set it to true if you don't want to see exceptions but the this.err only.
     * @type {boolean}
     */
    this.validate = validate || false;

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
        if (this.err) {
            return this;
        }
        this.err = _s.surround(str, ' (!) ');

        if (validate)
        {
            return this;
        }

        throw new Error(this.err);
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
        return this.concat_('USE')._validateKeyspaceName(keyspace, 'USE').concat_(keyspace);
    };

    /**
     * Appends 'SELECT ... ' to the query.
     * @param {(...string|string[])} columns - columns to retrieve.
     * @returns {FluentCql}
     */
    this.select = function select(columns) {
        return this.concat_('SELECT')._columnNames([].slice.call(arguments), 'SELECT').concat(' ');
    };

    this._columnNames = function _columnNames(columnNames, disposition) {
        if (this.err) {
            return this;
        }
        if (_.isString(columnNames)) {
            return this.concat(columnNames);
        }

        var names = _.compact(columnNames);
        if (names.length === 0 || names[0].length === 0) {
            return this.setError('argument(s) missing in ' + disposition);
        }

        if (_.all(names, _.isString)) {
            return this.concat(names.join(', '));
        }
        if (_.isArray(names[0])) {
            return this.concat(names[0].join(', '));
        }

        return this.setError('column name(s) must be string in ' + disposition);
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
        return this.concat_('FROM')._validateTableName(tableName, 'FROM').concat_(tableName);
    };

    /**
     * Appends 'WHERE ...' clause to the query.
     * @param {(object|string)} params - a fluent-object 'where' clause or a string.
     * @returns {FluentCql}
     */
    this.where = function where(params) {
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
        return this.concat_('KEYSPACE')._keyspace(ks, replication, durableWrites);
    };

    /**
     * Appends keyspace description 'KEYSPACE IN NOT EXISTS name WITH ...' to the query.
     * @param {string} ks - keyspace name.
     * @param {object} [replication="{'class': 'SimpleStrategy', 'replication_factor': '3'}"] - replication strategy options.
     * See {@link http://cassandra.apache.org/doc/cql3/CQL.html#createKeyspaceStmt}
     * @param {bool} [durableWrites=] - durable writes boolean. CQL defaults to 'true' if not present.
     * See {@link http://cassandra.apache.org/doc/cql3/CQL.html#createKeyspaceStmt}
     * @returns {FluentCql}
     */
    this.keyspaceIfNotExists = function keyspaceIfNotExists(ks, replication, durableWrites) {
        return this.concat_('KEYSPACE').ifNotExists()._keyspace(ks, replication, durableWrites);
    };

    this.ifNotExists = function ifNotExists() {
        if (this.err) {
            return this;
        }
        return this.concat_('IF NOT EXISTS');
    };

    this._keyspace = function _keyspace(ks, replication, durableWrites) {
        if (this.err) {
            return this;
        }
        return this._validateKeyspaceName(ks, 'KEYSPACE').concat_(ks)._keyspaceOptions(replication, durableWrites);
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
            else if (!_.has(constants.cqlReplicationStrategies().Strategy, replication['class'])) {
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

        this.concat_(JSON.stringify(replication).split('"').join("'"));
        if (!_.isUndefined(durableWrites)) {
            this.concat_('AND').concat_('durable_writes =').concat_(durableWrites.toString());
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
        return this.concat_('TABLE').ifNotExists()._table(name, columns);
    };

    this._table = function _table(name, columns) {
        if (this.err) {
            return this;
        }
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

        var validCqlTypes = constants.cqlTypes();
        var keyValuePairs = _.pairs(columns);
        var primaryKey = _.last(keyValuePairs);
        var primaryKeyConst = constants.primaryKey();
        if (primaryKey[0] !== primaryKeyConst.propName && primaryKey[0] !== primaryKeyConst.cqlText) {
            return this.setError('PRIMARY KEY must be last in TABLE');
        }

        primaryKey[0] = primaryKeyConst.cqlText;

        var columnKeys = _.head(_.keys(columns), keyValuePairs.length - 1);
        var columnValues = _.head(_.values(columns), keyValuePairs.length - 1);

        if (_.difference(columnValues, _.values(validCqlTypes)).length > 0) {
            return this.setError('use valid cql types while declaring columns in TABLE');
        }

        var primaryKeyContents = primaryKey[1];
        if (!_.isString(primaryKeyContents)) {
            if (!_.isArray(primaryKeyContents) || primaryKeyContents.length === 0) {
                return this.setError('PRIMARY KEY not found in TABLE');
            }
            var usedColumns = _.flatten(primaryKeyContents);
            var unknownColumns = _.difference(usedColumns, columnKeys);
            if (!_.all(usedColumns, _.isString) || unknownColumns.length > 0) {
                return this.setError('PRIMARY KEY contains unknown columns ' + unknownColumns.join() + ' in TABLE');
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
        if (this.err) {
            return this;
        }
        if (!name || !_.isString(name) || _s.isBlank(name) || _s.include(name, ' ')) {
            return this.setError('table name must be valid in ' + disposition);
        }
        return this;
    };

    this._validateKeyspaceName = function _validateKeyspaceName(name, disposition) {
        if (this.err) {
            return this;
        }
        if (!name || !_.isString(name) || _s.isBlank(name) || _s.include(name, ' ')) {
            return this.setError('keyspace name must be valid in ' + disposition);
        }
        return this;
    };

    this.insertInto = function insertInto() {
        var args = [].slice.call(arguments);
        if (args.length === 0) {
            return this.setError('arguments missing in INSERT INTO');
        }

        return this
            .concat_('INSERT INTO')
            ._validateTableName(args[0], 'INSERT INTO')
            .concat_(args[0])
            .concat('(')
            ._columnNames(args.slice(1), 'INSERT INTO')
            .concat_(')');
    };

    this.insertIntoValues = function insertInto() {
        var args = [].slice.call(arguments);
        if (args.length <= 1) {
            return this.setError('arguments missing in INSERT INTO...VALUES');
        }

        var tableName = args[0];
        var obj = args[1];
        var keys = _.keys(obj);
        var values = _.values(obj);

        return this
            .concat_('INSERT INTO')
            ._validateTableName(tableName, 'INSERT INTO...VALUES')
            .concat_(tableName)
            .concat('(')
            ._columnNames(keys, 'INSERT INTO...VALUES')
            .concat_(')')
            .concat_('VALUES')
            .concat('(')
            .concat(_.map(values, JSON.stringify).join(', ').split('"').join("'"))
            .concat_(')');
    };

    this.values = function values(vals) {
        var args = _.isArray(vals) ? vals :
            _.isObject(vals) ? _.values(vals) :
            [].slice.call(arguments);
        if (args.length === 0) {
            return this.setError('argument(s) missing in VALUES');
        }

        return this
            .concat_('VALUES')
            .concat('(')
            .concat(_.map(args, JSON.stringify).join(', ').split('"').join("'"))
            .concat_(')');
    };
}

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
 * @prop {string} timeuuidl -   CQL 'timeuuidl' type.
 * @prop {string} uuid -        CQL 'uuid' type.
 * @prop {string} varchar -     CQL 'varchar' type.
 * @prop {string} varint -      CQL 'varint' type.
 */
module.exports = FluentCql;