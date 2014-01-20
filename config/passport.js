var passport = require('passport')
  , BearerStrategy = require('passport-http-bearer').Strategy
  , redis = require('redis').createClient();

passport.use(new BearerStrategy({},
  function(token, done) {
    redis.get(token, function(err, reply) {
      if(err) throw err;
      done(null, reply, {scope: 'all'});
    });
  }
));