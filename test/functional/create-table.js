'use strict';


var demand = require('must');
var fcql = require('../../index');

describe('create table', function () {
  it('1', function () {
    var result = fcql.create().table('my_mega_table', {
      name: fcql.text, // allows usage of both hardcoded ('text') and/or fcql-provided CQL types
      eventDate: 'timestamp',
      device: fcql.uuid,
      sensor: 'int',
      description: 'text',
      PRIMARY_KEY: [['name', 'eventDate'], 'device', 'sensor']
    }).build();

    var expected =
      'CREATE TABLE my_mega_table (' +
      'name text, ' +
      'eventDate timestamp, ' +
      'device uuid, ' +
      'sensor int, ' +
      'description text, ' +
      'PRIMARY KEY ((name, eventDate), device, sensor)' +
      ');';

    result.must.equal(expected);
  });
});

