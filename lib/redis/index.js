var redis = require('redis');
var config = require('lib/config');
var url = require('url');
var querystring = require('querystring');
var _ = require('lodash');

var password, database;
var parsed_url  = url.parse(config.redis.url || process.env.REDIS_URL || 'redis://localhost:6379');
var parsed_auth = (parsed_url.auth || '').split(':');
var options = querystring.parse(parsed_url.query);

var client = module.exports = {
  create: function(opts) {
    opts = opts || {};
    var client = redis.createClient(parsed_url.port, parsed_url.hostname, _.extend(options, opts));
    if (password = parsed_auth[1]) {
      redis.auth(password, function(err) {
        if (err) throw err;
      });
    }

    if (database = parsed_auth[0]) {
      redis.select(database);
      redis.on('connect', function() {
        redis.send_anyways = true
        redis.select(database);
        redis.send_anyways = false;
      });
    }
    return client;
  }
}

client.default = client.create();