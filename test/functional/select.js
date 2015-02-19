'use strict';


var demand = require('must');
var fcql = require('../../index');

describe('create table', function () {
  it('1', function () {
    var result = fcql.select('something').from('somewhere').where({
        aStringKey: { GT: '0', LE: '9' },
        anIntKey: 123,
        aDateKey: [new Date(3141592653589), new Date(2141592653589)]
      }).build();

    var expected =
      "SELECT something FROM somewhere WHERE " +
      "aStringKey > '0' AND aStringKey <= '9' " +
      "AND anIntKey = 123 " +
      "AND aDateKey IN ('2069-07-21T00:37:33.589Z', '2037-11-11T22:50:53.589Z');";

    result.must.equal(expected);
  });
});

