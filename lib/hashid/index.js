var config = require('lib/config');
var hashids = new (require('hashids'))(config.hashIdKey);
var redis = require('lib/redis').default;
var _ = require('lodash');

module.exports = function(modelName, options, cb) {
  if(typeof options === 'function') {
    cb = options;
    options = {};
  }

  options.num = options.num || 1;
  options.offset = options.offset || 0;

  redis.incrby(modelName + ':hashid', options.num, function(err, id) {
    if(err) throw err;
    id = Number(id);
    var ids = _.times(options.num, function(i) {
      return hashids.encrypt(id + i + options.offset);
    });

    cb(null, options.num === 1 ? ids[0] : ids);
  });
};

exports.sixDigitOffset = 3748096;