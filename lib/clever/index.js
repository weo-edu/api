var config = require('lib/config');
var request = require('superagent');
var cleverToken = require('clever-oauth-token')(
  config.cleverClientId,
  config.cleverClientSecret
);

function Clever(token) {
  this.token = token;
}

Clever.identify = function(params, cb) {
  Clever.exchangeCodeForToken(params, function(err, token) {
    if(err) return cb(err);

    var clever = new Clever(token);
    clever.me(function(err, me) {
      if(err) return cb(err);
      cb(null, me);
    });
  });
};

Clever.exchangeCodeForToken = function(params, cb) {
  cleverToken({
    redirect_uri: params.redirectUri,
    code: params.code
  }, cb);
};

Clever.prototype.me = function(cb) {
  var self = this;
  request('https://api.clever.com/me')
    .set('Authorization', 'Bearer ' + this.token)
    .end(function(err, res) {
      if(err) return cb(err);
      self.student(res.body.data.id, cb);
    });
};

Clever.prototype.student = function(id, cb) {
  request('https://api.clever.com/v1.1/students/' + id)
    .set('Authorization', 'Bearer ' + this.token)
    .end(function(err, res) {
      if(err) return cb(err);
      cb(null, res.body.data);
    });
};

module.exports = Clever;