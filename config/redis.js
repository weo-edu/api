var redisUrl = process.env.REDISTOGO_URL || 'redis://0:@localhost:6379';
var parseRedisUrl = require('parse-redis-url')();

module.exports.redis = parseRedisUrl.parse(redisUrl);