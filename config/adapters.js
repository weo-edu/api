/**
 * Global adapter config
 *
 * The `adapters` configuration object lets you create different global "saved settings"
 * that you can mix and match in your models.  The `default` option indicates which
 * "saved setting" should be used if a model doesn't have an adapter specified.
 *
 * Keep in mind that options you define directly in your model definitions
 * will override these settings.
 *
 * For more information on adapter configuration, check out:
 * http://sailsjs.org/#documentation
 */

function mongoHqParse(href) {
  var parsed = require('url').parse(href)
    , parts = parsed.auth.split(':');

  return {
    module: 'sails-mongo',
    host: parsed.hostname,
    port: parsed.port,
    database: parsed.path.slice(1),
    user: parts[0],
    password: parts[1]
  };
}

var mongoHq = null;
if(process.env.MONGOHQ_URL)
  mongoHq = mongoHqParse(process.env.MONGOHQ_URL);

var adapters = module.exports.adapters = {

  // If you leave the adapter config unspecified
  // in a model definition, 'default' will be used.
  'default': 'mongo',

  // Persistent adapter for DEVELOPMENT ONLY
  // (data is preserved when the server shuts down)
  disk: {
    module: 'sails-disk'
  },
  mongo: mongoHq || {
    module: 'sails-mongo',
    host: 'localhost',
    port: 27017,
    database: 'sails',
  },
  // MySQL is the world's most popular relational database.
  // Learn more: http://en.wikipedia.org/wiki/MySQL
  myLocalMySQLDatabase: {

    module: 'sails-mysql',
    host: 'YOUR_MYSQL_SERVER_HOSTNAME_OR_IP_ADDRESS',
    user: 'YOUR_MYSQL_USER',
    // Psst.. You can put your password in config/local.js instead
    // so you don't inadvertently push it up if you're using version control
    password: 'YOUR_MYSQL_PASSWORD',
    database: 'YOUR_MYSQL_DB'
  }
};
console.log('mongo adapter', adapters.mongo);
// function randomDbName(prefix) {
//   return (prefix || '') + '_' + (new Date);
// }

// if(process.env.NODE_ENV === 'testing') {
//   var sails = require('sails');
//   // Cache the random name here, in the off-chance that someone accidentally
//   // modifies adapters.mongo.database at some later point, we don't want
//   // to accidentally obliterate real data
//   var randomName = adapters.mongo.database = randomDbName('testing');

//   sails.on('bootstrap', function() {
//     var testData = require('../lib/testData.js');
//     _.each(testData, function(data, collectionName) {
//       sails.adapters['sails-mongo'].native(collectionName, function(err, col) {
//         if(err) throw err;
//         _.each(data, function(doc) {
//           col.insert(doc);
//         });
//       });
//     });
//   });
// }