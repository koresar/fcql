Fluent CQL (fcql)
====

Allows fluent syntax for Cassandra Query Language (cql). Basically it creates CQL string queries from JavaScript code.

**NOTE! Only [CQL3](http://cassandra.apache.org/doc/cql3/CQL.html#createKeyspaceStmt) is supported.**

Example:
```js
var stringQuery = fcql.select(['key', 'email', 'last_name'])
.from('user_profiles')
.where( { key: 'my_user' }).build();
```
results with
```sql
SELECT key, email, last_name
FROM user_profiles
WHERE key = 'my_user';
```

Also raw strings work:
```js
var stringQuery = fcql.select('key, email, last_name')
.from('user_profiles')
.where('key="my_user"').build();
```
results the same as above.

## For whom?
* The library validates given parameters so that you do less mistakes and code faster.
* The library helpful for CQL newbies. JSDoc supported functions will show you available options.
* The library allows partial query reuse (DRY). You can store 'SELECT...FROM...' and then add 'WHERE' as new query needed.

## Usage
```js
var fcql = require('fcql');
```
### Creating tables
```js
fcql.create().table('my_mega_table', {
  name: fcql.text, // allows usage of both hardcoded ('text') and/or fcql-provided CQL types
  eventDate: 'timestamp',
  device: fcql.uuid,
  sensor: 'int',
  description: 'text',
  PRIMARY_KEY: [ ['name', 'eventDate'], 'device', 'sensor' ]
}).build();
```
results with
```sql
CREATE TABLE my_mega_table (
  name text,
  eventDate timestamp,
  device uuid,
  sensor int,
  description text,
  PRIMARY KEY ((name, eventDate), device, sensor)
);
```
### Querying for data
```js
fcql.select('something').from('somewhere').where({
  aStringKey: {GT: '0', LE: '9'},
  anIntKey: 123,
  aDateKey: [new Date(3141592653589), new Date(2141592653589)]
});
```
results with
```sql
SELECT something FROM somewhere WHERE 
aStringKey > '0' AND aStringKey <= '9' 
AND anIntKey = 123 
AND aDateKey IN ('2069-07-21T00:37:33.589Z', '2037-11-11T22:50:53.589Z');
```

## Want to contribute?
It is [Open Open Source](http://openopensource.org/). Whoever sends a PR, which gets accepted, receives the write permissions.
