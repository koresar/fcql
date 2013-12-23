'use strict';

var stampit = require('stampit');
var _ = require('underscore');
var _s = require('underscore.string');

var errorState = function () {
    /**
     * Indicates if there were errors while building the string. Contains error message.
     * @type {string}
     */
    this.err = undefined;

    /**
     * Marks this object as malformed, sets the error message. As the result no any further object building possible.
     * @param {string} str -
     * @returns {FluentCql}
     * @private
     */
    var _setError = function _setError(str) {
        this.err = _s.surround(str, ' (!) ');
        return this;
    };

    var _validateName = function _validateName(name, errMsg, context) {
        if (!name || !_.isString(name) || _s.isBlank(name) || _s.include(name, ' ')) {
            return context.setError(errMsg);
        }
        return context;
    };
};

var builderState = function builderState() {
    /**
     * This variable contains the query string.
     * @type {string}
     */
    var query = '';

    return stampit.mixIn(this, {
        /**
         * Returns the resulting query string, OR error message.
         * @returns {string}
         */
        build: function build() {
            return this.err ? (this.err + (_s.isBlank(query) ? '' : _s.quote(query + '???'))) : query;
        },

        /**
         * Appends the given string to the end of the query.
         * @param {string} str - string to append.
         * @returns {FluentCql}
         */
        concat: function concat(str) {
            if (this.err) {
                return this;
            }
            query += str;
            return this;
        },

        /**
         * Appends the given string and a trailing space to the end of the query.
         * @param {string} str - string to append.
         * @returns {FluentCql}
         */
        concat_: function concat_(str) {
            if (this.err) {
                return this;
            }
            return this.concat(str + ' ');
        }
    });
};
