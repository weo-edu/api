var path = require('path');
var express = require('express');
var debug = require('debug')('weo:boot');
var config = require('lib/config');

var app = module.exports = express();

// Global middleware
var cors = require('cors');
var compression = require('compression');
var bodyParser = require('body-parser');
var injectLatency = require('express-inject-latency');
debug('configuring express...');


//app.use(require('express-inject-latency')({mean: 500, variance: 1}));

if(app.get('env') === 'development' || app.get('env') === 'ci') {
  var inject = injectLatency({mean: 500, variance: 1});
  app.use(function(req, res, next) {
    return req.query.hasOwnProperty('latency')
      ? inject.apply(this, arguments)
      : next();
  });

  debug('development mode');
  // Enable logging in dev mode
  //app.use(require('morgan')());
}

/**
 * Browserify client assets
 */
require('lib/client-models')();
require('lib/router.io-client')();

/**
 * Express middleware
 */

// Enable CORS requests, since this is an API server
app.use(cors({
  origin: '*',
  // Add patch method to the defaults supported by the cors middleware
  methods: 'GET,HEAD,PUT,POST,DELETE,PATCH'
}));

// Enable gzip compression
app.use(compression());

// Body parser
app.use(bodyParser());

// convert lists to objects with list meta
app.use(require('lib/list-middleware')());

// array parse helper
app.use(function(req, res, next) {
  req.paramAsArray = function(name) {
    return [].concat(req.param(name)).filter(Boolean);
  };
  next();
});

// Install our primary app
app.use(require('lib/main'));

// Serve static files in our public folder

app.use(express.static(path.join(process.cwd(), 'public')));


app.use('/assets', express.static(path.join(process.cwd(), 'assets')));

/**
 * Error handling
 */
app.use(require('lib/error-logger')({stack: true}));
app.use(require('lib/error-handler')());

var server = app.listen(config.port, function() {
  debug('listening on %d', config.port);
  app.emit('up', app, server);
});
app.emit('listen', app, server);

require('debug-trace')({always: true});
