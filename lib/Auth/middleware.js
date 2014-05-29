var Auth = require('./model');
var passport = require('passport');
var middleware = module.exports;

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