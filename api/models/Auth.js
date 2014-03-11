/**
 * Auth
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
 var Seq = require('seq')
   , crypto = require('crypto');

 module.exports = {
  adapter: 'sails-redis',
  attributes: {

  	/* e.g.
  	nickname: 'string'
  	*/

  },
  lookupToken: function(token, cb) {
    redis.get(token, function(err, data) {
      if(err) cb(err, null);
      cb(null, JSON.parse(data));
    });
  },
  createToken: function(data, expiresIn, cb) {
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
  }
};
