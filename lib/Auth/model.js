var redis = require('lib/redis').default;
var Seq = require('seq');
var crypto = require('crypto');

exports.createToken = function(data, expiresIn, cb) {
  Seq()
    .seq(function() {
      crypto.randomBytes(16, this);
    })
    .seq(function(buf) {
      this.vars.token = buf.toString('base64').slice(0, -2);
      redis.set(this.vars.token, JSON.stringify(data), this);
    })
    .seq(function() {
      if(expiresIn) {
        redis.expire(this.vars.token, expiresIn, this);
      } else
        this();
    })
    .seq(function() {
      cb(null, this.vars.token);
      this();
    })
    .catch(function(err) {
      throw err;
    });
};

exports.lookupToken = function(token, cb) {
  redis.get(token, function(err, data) {
    if(err) cb(err, null);
    else cb(null, JSON.parse(data));
  });
};

exports.destroyToken = function(token, cb) {
  redis.del(token, cb);
};