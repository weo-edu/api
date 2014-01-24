var hashids = new (require('hashids'))('themang')
  , redis = require('redis')
  , client = redis.createClient();

exports = module.exports = function(modelName, options, cb) {
  if(typeof options === 'function') {
    cb = options;
    options = {};
  }

  options.num = options.num || 1;
  options.offset = options.offset || 0;

  client.incrby(modelName + ':hashid', options.num, function(err, id) {
    if(err) throw err;
    var ids = _.times(options.num, function(i) {
      return hashids.encrypt(id + i + options.offset);
    });
    cb(null, options.num === 1 ? ids[0] : ids);
  });
};

exports.sixDigitOffset = 3748096;