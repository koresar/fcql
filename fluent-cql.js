'use strict';
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

/**
 * Fluent syntax for Cassandra CQL.
 * @constructor
 */
function FluentCql() {
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
    this.toString = function toString() {
        var q = _s.isBlank(query) ? ';' : (_s.rtrim(query) + ';');
        return this.err ? (this.err + (_s.isBlank(query) ? '' : _s.quote(query + '???'))) : q;
    };

    /**
     * @param str
     * @returns {FluentCql}
     * @private
     */
    this.setError = function setError(str) {
        this.err = _s.surround(str, ' (!) ');
        return this;
    };

    /**
     * Add the given string to the end of the query.
     * @param str
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
     * Add the given string and a trailing space to the end of the query.
     * @param str
     * @returns {FluentCql}
     */
    this.concat_ = function concat_(str) {
        if (this.err) {
            return this;
        }
        return this.concat(str + ' ');
    };

    /**
     * @returns {FluentCql}
     */
    this.select = function select() {
        if (this.err) {
            return this;
        }

        var args = _.compact(arguments);
        if (args.length === 0) {
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
     * @returns {FluentCql}
     */
    this.selectAll = function selectAll() {
        return this.select('*');
    };

    /**
     * @param tableName
     * @returns {FluentCql}
     */
    this.from = function from(tableName) {
        if (this.err) {
            return this;
        }

        return this.concat_('FROM')._validateTableName(tableName, 'FROM').concat_(tableName);
    };

    /**
     * @param params
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
            return this.setError('parameter(s) missing in WHERE');
        }

        this.concat_('WHERE');

        var clauses = _.map(
            keyValuePairs,
            function (keyValuePair) {
                if (this.err) {
                    return;
                }
                var key = keyValuePair[0],
                    value = keyValuePair[1];
                if (!value) {
                    return this.setError('value missing for key ' + key + ' in WHERE');
                }

                if (_.isString(value)) {
                    if (value.length === 0) {
                        return this.setError('value is missing for key ' + key + ' in WHERE');
                    }

                    return [key, '=', JSON.stringify(value)].join(' ');
                }
                else if (_.isDate(value)) {
                    // Lucky us the JSON.stringify(Date) produces UTC time. Otherwise I'd kill myself.
                    return [key, '=', JSON.stringify(value)].join(' ');
                }
                else if (_.isArray(value)) {
                    if (value.length === 0) {
                        return this.setError('values are missing for key ' + key + ' in WHERE');
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

                    if (operators.length < 1 || operators.length > 2 || !_.contains(_.keys(conditionOps), _s.capitalize(operators[0][0]))) {
                        return this.setError('there must be 1 or 2 relational operator (EQ,GT,LT,LE,GE) for key ' + key + ' in WHERE');
                    }

                    var clause = [key, conditionOps[operators[0][0]], JSON.stringify(operators[0][1])];
                    if (operators.length === 2) {
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

    this.create = function create() {
        return this.concat_('CREATE');
    };

    this.table = function table(name, columns) {
        return this.concat_('TABLE')._table(name, columns);
    };

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
}

function cqlQueries() {
    var obj = {};
    // This list of FluentCql class functions will be reused and delegated to.
    _.each(['select', 'selectAll', 'create'],
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

var fcql = stampit().state(cqlQueries()).state(cqlTypes()).create();
module.exports = fcql;
//
//console.log('=== VALID ===');
//
//var test = fcql.select('*').from('somewhere');
//console.log(test.toString());
//
//test = new FluentCql();
//test.selectAll().from('tbl').where({a: "a"});
//console.log(test.toString());
//
//
//test = new FluentCql();
//test.select('pzdc', 'blya').from('sometable').where({a: {GT: 'str123'}, b: [321, 123], c: {LT: 1.0}});
//console.log(test.toString());
//
//
//test = new FluentCql();
//test.select('pzdc').from('sometable').where({a: 'eq str', b: 13.1, c: new Date()});
//console.log(test.toString());
//
//
//test = new FluentCql();
//test.select('pzdc').from('sometable').where({a: {GE: 123}, b: {GE: new Date(), LT: new Date()}});
//console.log(test.toString());
//
//
//test = fcql.create().tableIfNotExists('tblName', {
//    name: 'text',
//    eventDate: 'text',
//    reader: 'text',
//    antenna: fcql.int,
//    description: 'text',
//    PRIMARY_KEY: [
//        ['name', 'eventDate'],
//        'reader',
//        'antenna'
//    ]
//});
//console.log(test.toString());
//
//console.log('=== FAULTY ===');
//
//test = new FluentCql();
//test.select('pzdc').from('sometable').where({a: []});
//console.log(test.toString());
//
//
//test = new FluentCql();
//test.select('pzdc').from('sometable').where({a: {ELSE: "1.0"}});
//console.log(test.toString());
//
//
//test = new FluentCql();
//test.select('pzdc').from('sometable').where({a: {GE: 123}, b: undefined, c: {LE: "1.0"}});
//console.log(test.toString());
//
//
//test = new FluentCql();
//test.select().from('sometable');
//console.log(test.toString());
//
//
//test = new FluentCql();
//test.select('pzdc').from();
//console.log(test.toString());
