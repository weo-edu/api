var hashids = new (require('hashids'))('themang')
  , redis = require('redis')
  , client = redis.createClient();

module.exports = function(modelName) {
  return function(attrs, cb) {
    client.incr(modelName + ':hashid', function(err, id) {
      if(err) throw err;

      attrs._id = hashids.encrypt(id);
      attrs.url = [attrs.domain, modelName, attrs._id].join('/');
      delete attrs.domain;
      cb(null, attrs);
    });
  };
};