var config = require('lib/config');
var request = require('superagent');
var cleverToken = require('clever-oauth-token')(
  config.cleverClientId,
  config.cleverClientSecret
);

function Clever(token) {
  this.token = token;
}

Clever.exchangeCodeForToken = function(params, cb) {
  cleverToken({
    redirect_uri: params.redirectUri,
    code: params.code
  }, cb);
};

Clever.prototype.me = function() {

};

module.exports = Clever;