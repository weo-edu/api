var Auth = require('./model');
var passport = require('passport');
var errors = require('lib/errors');
var middleware = module.exports;
var mongoose = require('mongoose');
var request = require('request');

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

middleware.google = function(req, res, next) {
  var User = mongoose.model('User');
  var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
  var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';

  var params = {
    client_id: req.body.clientId,
    redirect_uri: req.body.redirectUri,
    client_secret: process.env.GOOGLE_SECRET,
    code: req.body.code,
    grant_type: 'authorization_code'
  };

  // Step 1. Exchange authorization code for access token.
  request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {
    if (token.error) {
      throw new Error(token.error_description);
    }

    var accessToken = token.access_token;
    var headers = { Authorization: 'Bearer ' + accessToken };

    // Step 2. Retrieve profile information about the current user.
    request.get({ url: peopleApiUrl, headers: headers, json: true }, function(err, response, profile) {
      // Step 3a. If user is already signed in then link accounts.
      if (req.user) {
        User.findOne({ 'auth.google': profile.sub }, function(err, existingUser) {
          if (existingUser) {
            return next(errors.OAuthLink('There is already a Google account that belongs to you'));
          }

          req.user.linkToGoogle(profile);
          req.user.save(next);

        });
      } else {
        // Step 3b. Create a new user account or return an existing one.
        User.findOne({ 'auth.google': profile.sub }, function(err, existingUser) {
          if (existingUser) {
            req.user = existingUser;
            return next();
          }

          var options = {userType: req.body.userType};
          if (req.body.groups);
            options.groups = req.body.groups;

          var user = req.user = new User(options);
          user.linkToGoogle(profile);
          user.save(next);
        });
      }
    });
  });
};