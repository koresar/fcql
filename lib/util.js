'use strict';

var _ = require('underscore');
var _s = require('underscore.string');

exports.validateName = function validateName(name, errMsg) {
    if (!name || !_.isString(name) || _s.isBlank(name) || _s.include(name, ' ')) {
        return this.setError(errMsg);
    }
    return this;
};