var Auth = require('./model');
var passport = require('passport');
var errors = require('lib/errors');
var mongoose = require('mongoose');
var Google = require('lib/google');
var clever = require('lib/clever');
var crypto = require('crypto');

// Decorate request with the req.auth object retrieved from the access
// token.
//
// Note: This is *NOT* an isAuthenticated check, the user
//       exports will succeed whether or not the user
//       is logged in.
exports.user = function(req, res, next) {
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


exports.isAuthenticated = passport.authenticate('bearer', {session: false});

// Setup passport
var BearerStrategy = require('passport-http-bearer').Strategy;

passport.use(new BearerStrategy({}, function(token, done) {
  Auth.lookupToken(token, function(err, data) {
    if(err) done(err);
    else done(null, data, {scope: 'all'});
  });
}));

exports.passport = passport.initialize({userProperty: 'auth'});


// Normalize the location of the access token to req.access_token
exports.token = function(req, res, next) {
  if(req.query && req.query.access_token) {
    req.access_token = req.query.access_token;
  } else if(req.body && req.body.access_token) {
    req.access_token = req.body.access_token;
  } else if(req.headers && req.headers.authorization) {
    req.access_token = req.headers.authorization.split(' ')[1];
  }
  next();
};

exports.checkPassword = function(req, res, next) {
  var password = req.param('password');
  if(! req.user.checkPassword(password))
    return next(errors.Authentication('Incorrect password', 'password', password));

  next();
};

exports.lookupByGoogle = function(req, res, next) {
  var code = req.body.code;
  var redirectUri = req.body.redirectUri;

  Google
    .exchangeCodeForTokens({code: code, redirectUri: redirectUri})
    .then(function(tokens) {
      return Google.authenticated(tokens).getProfile();
    })
    .then(function(profile) {
      req.profile = profile;
      var User = mongoose.model('User');
      return User.findOne()
        .where('auth.google.id', profile.id)
        .exec();
    })
    .then(function(user) {
      req.user = user;
      next();
    })
    .catch(next);
};

exports.googleCreateIfNew = function(req, res, next) {
  if(req.user) return next();
  if(! req.profile) return next(new Error('googleCreate requires req.profile'));


  var opts = translateGoogleProfile(req.profile);
  opts.userType = req.body.userType;

  if (req.body.groups);
    opts.groups = req.body.groups;

  createOAuthAccount(opts, setUser(req, next));
};

function setUser(req, next) {
  return function(err, user) {
    if(err) return next(err);
    req.user = user;
    next();
  };
}

function createOAuthAccount(opts, cb) {
  crypto.randomBytes(16, function(err, buf) {
    if(err) return cb(err);

    var User = mongoose.model('User');
    User.findUsernameLike(opts.username, function(err, username) {
      if(err) return cb(err);

      opts.username = username;
      var user = new User(opts);
      user.password = buf.toString('base64').slice(0, -2);
      user.save(cb);
    });
  });
}

function translateGoogleProfile(profile) {
  return {
    auth: {
      google: {
        id: profile.id
      }
    },
    displayName: profile.displayName,
    email: profile.emails && profile.emails.length && profile.emails[0].value,
    name: {
      givenName: profile.name.givenName,
      familyName: profile.name.familyName,
      honorificPrefix: profile.name.honorificPrefix
    }
  };
}

function translateCleverProfile(profile) {
  var first = profile.name && profile.name.first;
  var last = profile.name && profile.name.last;

  // Make absolutely sure we get some kind of username
  var username = (profile.credentials && profile.credentials.district_username)
    || (first && last && first + '-' + last)
    || profile.student_number || profile.teacher_number
    || profile.id;

  // If a teacher doesn't have a registered email address
  // for now we'll just make one up.  Super janks, but
  // otherwise they can't get into our system.
  var userType = profile.student_number ? 'student' : 'teacher';
  if(userType === 'teacher' && ! profile.email)
    profile.email = profile.id + '@weo.io';

  return {
    username: username,
    userType: userType,
    auth: {
      clever: {
        id: profile.id
      }
    },
    email: profile.email,
    name: {
      givenName: first,
      familyName: last
    }
  };
}



exports.lookupByClever = function(req, res, next) {
  clever.identify(req.body, function(err, cleverUser) {
    if(err) return next(err);
    req.cleverUser = cleverUser;
    var User = mongoose.model('User');
    User.findOne()
      .where('auth.clever.id', req.cleverUser.id)
      .exec(function(err, user) {
        if(err) return next(err);
        req.user = user;
        next();
      });
  });
};

exports.cleverCreateIfNew = function(req, res, next) {
  req.user
    ? next()
    : createOAuthAccount(translateCleverProfile(req.cleverUser), setUser(req, next));
};
