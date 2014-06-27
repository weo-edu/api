var User = require('lib/User').model;

module.exports = function() {
  return function(req, res, next) {
    User.findById(req.socket.auth.id, function(err, user) {
      if(err) throw err;
      req.socket.tokens = user.tokens().reduce(function(memo, token) {
        memo[token] = true;
        return memo;
      }, {});
      next();
    });
  };
};