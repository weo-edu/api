var redis = require('redis')
  , client;

console.log('REDIS', process.env.REDISTOGO_URL);
if(process.env.REDISTOGO_URL) {
  var parsed = require('url').parse(process.env.REDISTOGO_URL)
    , parts = parsed.auth.split(':');

  client = redis.createClient(parsed.port, parsed.hostname);
  client.auth(parts[1]);
} else
  client = redis.createClient();

module.exports = client;