var weoErrorCodes = require('weo-error-codes');
var injectLatency = require('express-inject-latency');

module.exports.express = {
  customMiddleware: function(app) {
    app.use(require('sails/node_modules/express').compress());
    app.use(weoErrorCodes());
    // if(process.env.NODE_ENV === 'development')
    //   app.use(injectLatency({mean: 1000}));
  }
};
