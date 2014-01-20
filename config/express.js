var passport = require('passport')
  , weoErrorCodes = require('weo-error-codes');

module.exports.express = {
  customMiddleware: function(app) {
    app.use(passport.initialize());
    app.use(weoErrorCodes());
  }
};