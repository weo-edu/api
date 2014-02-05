var Seq = require('seq')
  , crypto = require('crypto')
  , redis = require('redis').createClient();

module.exports = function(data, expiresIn, cb) {
  Seq()
    .seq(function() {
      crypto.randomBytes(16, this);
    })
    .seq(function(buf) {
      this.vars.token = buf.toString('base64');
      redis.set(this.vars.token, data, this);
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