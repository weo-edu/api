var passport = require('passport')
  , weoErrorCodes = require('weo-error-codes');

module.exports.express = {
  customMiddleware: function(app) {
    app.use(function(req, res, next) {
      if(! req.headers.authorization && req.cookies.authToken) {
        req.headers.authorization = 'Bearer ' + req.cookies.authToken;
      }
      next();
    });

    app.use(passport.initialize());
    app.use(weoErrorCodes());
  }
};
