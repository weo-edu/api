var middleware = module.exports;
var User = require('./model');
var errors = require('lib/errors');
var validations = require('lib/validations');

middleware.me = function(req, res, next) {
  if(! req.auth) return next(errors.Server('me middleware requires req.auth'));
  User.findById(req.auth.id, function(err, user) {
    if(err) return next(err);
    // This should probably not be possible, but just in case
    if(! user) return next(errors.NotFound());
    req.me = user;
    next();
  });
};

/*
  Policy middleware that restricts access to users of a certain type
 */
middleware.is = function(type) {
  return function(req, res, next) {
    if(! req.auth)
      return next(errors.Server('is middleware requires req.auth'));
    if(req.auth.role !== type)
      return next(errors.Authorization());
    next();
  };
};

middleware.byUsernameOrEmail = function(req, res, next) {
  var username = req.param('username');
  User.where(validations.email(username) ? 'email' : 'username', username)
    .findOne(function(err, user) {
      if(err) return next(err);
      if(! user)
        return next(errors.NotFound('User not found', 'username', username));

      req.user = user;
      next();
    });
};