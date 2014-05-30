var middleware = module.exports;
var User = require('./model');
var errors = require('lib/errors');
var validations = require('lib/validations');

middleware.me = function(no404, property) {
  var should404 = ! no404;
  return function(req, res, next) {
    if(! req.auth) {
      if(should404) return next(errors.Server('me middleware requires req.auth'));
      else return next();
    }

    User.findById(req.auth.id, function(err, user) {
      if(err) return next(err);
      // This should probably not be possible, but just in case
      if(! user && should404) return next(errors.NotFound());
      req[property || 'me'] = user;
      console.log('set user', property);
      next();
    });
  };
};

/*
  Policy middleware that restricts access to users of a certain type
 */
middleware.is = function(type) {
  return function(req, res, next) {
    if(! req.auth)
      return next(errors.Server('is middleware requires req.auth'));

    if(req.auth.role !== type) {
      return next(errors.Authorization('not type "' + type + '"'));
    }
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