var redis = require('redis');
var config = require('../../config/redis').redis;

var client = redis.createClient(config.port, config.host);
if(config.password)
  client.auth(config.password);

module.exports = client;