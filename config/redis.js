var redisUrl = process.env.REDISTOGO_URL || 'redis://@localhost:6379/0';
var parseRedisUrl = require('parse-redis-url')();

module.exports.redis = parseRedisUrl.parse(redisUrl);
console.log('redis', module.exports.redis);