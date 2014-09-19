var config = require('lib/config').hashIds;
var hashids = new (require('hashids'))(config.key, config.minLength, config.alphabet);
var redis = require('lib/redis').default;

module.exports = function(modelName, cb) {
  redis.incrby(modelName + ':hashid', 1, function(err, id) {
    cb(err, err ? null : hashids.encode(id));
  });
};