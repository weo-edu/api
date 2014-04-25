var config = require('lib/config');
var redis = module.exports = require('redis-url').connect(config.redis.url);