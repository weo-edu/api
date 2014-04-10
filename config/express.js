var passport = require('passport');
var weoErrorCodes = require('weo-error-codes');
var injectLatency = require('express-inject-latency');

module.exports.express = {
  customMiddleware: function(app) {
    app.use(require('sails/node_modules/express').compress());
    app.use(function(req, res, next) {
      if(! req.headers.authorization && req.cookies.authToken) {
        req.headers.authorization = 'Bearer ' + req.cookies.authToken;
      }
      next();
    });

    app.use(passport.initialize());
    app.use(weoErrorCodes());
    // if(process.env.NODE_ENV === 'development')
    //   app.use(injectLatency({mean: 200}));
  }
};
