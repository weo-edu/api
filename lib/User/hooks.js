var passwordHash = require('password-hash');
var config = require('lib/config');

exports.hashPassword = function() {
  return function(user, next) {
    user.password = passwordHash.generate(user.password, config.hash);
    next();
  };
};