var Auth = require('./model');
var passport = require('passport');
var errors = require('lib/errors');
var middleware = module.exports;
var mongoose = require('mongoose');


// Decorate request with the req.auth object retrieved from the access
// token.
//
// Note: This is *NOT* an isAuthenticated check, the user
//       middleware will succeed whether or not the user
//       is logged in.
middleware.user = function(req, res, next) {
  if(req.access_token) {
    Auth.lookupToken(req.access_token, function(err, auth) {
      if(err) return next(err);
      req.auth = auth;
      next();
    });
  } else {
    req.auth = null;
    next();
  }
};



middleware.isAuthenticated = passport.authenticate('bearer', {session: false});

// Setup passport
var BearerStrategy = require('passport-http-bearer').Strategy;

passport.use(new BearerStrategy({}, function(token, done) {
  Auth.lookupToken(token, function(err, data) {
    if(err) done(err);
    else done(null, data, {scope: 'all'});
  });
}));

middleware.passport = passport.initialize({userProperty: 'auth'});


// Normalize the location of the access token to req.access_token
middleware.token = function(req, res, next) {
  if(req.query && req.query.access_token) {
    req.access_token = req.query.access_token;
  } else if(req.body && req.body.access_token) {
    req.access_token = req.body.access_token;
  } else if(req.headers && req.headers.authorization) {
    req.access_token = req.headers.authorization.split(' ')[1];
  }
  next();
};

middleware.checkPassword = function(req, res, next) {
  var user = req.user;
  var password = req.param('password');
  if(user.checkPassword(password))
    next();
  else
    next(errors.Authentication('Incorrect password', 'password', password));
};

middleware.ifCreate = function(createMd, loginMd) {
  return function(req, res, next) {
    if (req.body.userType)
      return createMd(req, res, next);
    else {
      return loginMd(req, res, next);
    }
  };  
};

middleware.googleCreate = function(req, res, next) {
  console.log('google create');
  var User = mongoose.model('User');
  User.findByGoogle(req.body, function(err, user, profile) {
    if (err) return next(err);
    if (user) {
      req.user = user;
      return next();
    }
    var options = {userType: req.body.userType};
    if (req.body.groups);
      options.groups = req.body.groups;

    user = req.user = new User(options);
    user.linkToGoogle(profile);
    user.save(next);
  });
};

middleware.googleLogin = function(req, res, next) {
  console.log('google login');
  var User = mongoose.model('User');
  User.findByGoogle(req.body, function(err, user) {
   if (user) {
      req.user = user;
      return next();
    } else {
      next(errors.NotFound('User not found - create account first', 'username'));
    }
  });
};

middleware.googleLink = function(req, res, next) {
  var User = mongoose.model('User');
  User.findByGoogle(req.body, function(err, user, profile) {
   if (user) {
      return next(errors.OAuthLink('There is already a Google account that belongs to you'));
    } else {
      req.user.linkToGoogle(profile);
      req.user.save(next);
    }
  });
};