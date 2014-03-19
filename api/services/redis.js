var redis = require('redis');
var config = require('../../config/redis');

var client = redis.createClient(config.port, config.hostname);
if(config.password)
  client.auth(config.password);

module.exports = client;