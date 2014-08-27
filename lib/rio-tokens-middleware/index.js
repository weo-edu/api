var User = require('lib/User').model;
var errors = require('lib/errors');

module.exports = function() {
  return function(req, res, next) {
    console.log('auth id', req.socket.auth.id);
    User.findById(req.socket.auth.id, function(err, user) {
      if(err) throw err;
      if (!user) return next(errors.NotFound('User not found')) 
      req.socket.tokens = user.tokens().reduce(function(memo, token) {
        memo[token] = true;
        return memo;
      }, {});
      next();
    });
  };
};