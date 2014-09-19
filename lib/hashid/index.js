var config = require('lib/config').hashIds;
var hashids = new (require('hashids'))(config.key, config.minLength, config.alphabet);
var redis = require('lib/redis').default;

module.exports = function(modelName, cb) {
  console.log('incrBy', modelName + ':hashid', 1);
  redis.incrby(modelName + ':hashid', 1, function(err, id) {
    console.log('incrBy cb', err, id);
    cb(err, err ? null : hashids.encode(id));
  });
};