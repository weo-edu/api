var passport = require('passport')
  , BearerStrategy = require('passport-http-bearer').Strategy;

passport.use(new BearerStrategy({},
  function(token, done) {
    Auth.lookupToken(token, function(err, data) {
      if(err) throw err;
      done(null, data, {scope: 'all'});
    });
  }
));