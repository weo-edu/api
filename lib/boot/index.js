/**
 * boot
 *
 * Configure express as a webserver, generate
 * assets and other bootstrapping tasks
 */

/**
 * Dependencies
 */
var path = require('path');
var express = require('express');
var debug = require('debug')('weo:boot');
var config = require('lib/config');
var cors = require('cors');
var compression = require('compression');
var bodyParser = require('body-parser');
var injectLatency = require('lib/inject-latency');
var morgan = require('morgan');

/**
 * Browserify client assets
 */
require('lib/client-models')();
require('lib/router.io-client')();


var app = module.exports = express();

/**
 * Express middleware
 */
debug('configuring express...');

// Request logging
if(app.get('env') !== 'ci') {
  app.use(morgan('tiny', {
    skip: function(req, res) {
      var time = morgan['response-time'](req, res);
      return time < 100;
    }
  }));
}

// Latency injection for tests
// app.use(injectLatency.always);
if(app.get('env') === 'development' || app.get('env') === 'ci')
  app.use(injectLatency.byParam);


// Enable CORS requests, since this is an API server
app.use(cors({
  origin: '*',
  // Add patch method to the defaults supported by the cors middleware
  methods: 'GET,HEAD,PUT,POST,DELETE,PATCH'
}));

// Enable gzip compression
app.use(compression());

// Body parser
app.use(bodyParser({
  limit: 1024 * 1024 * 10 //10mb
}));

// Disable browser caching of API requests
app.use(require('lib/no-cache'));

/**
 * Initialize and connect to the database
 */

require('lib/db');

/**
 * Load main application
 */

app.use(require('lib/main'));

/**
 * Static files
 */

// Serve static files in our public folder
app.use(express.static(path.join(process.cwd(), 'public')));

// Needed for fastly caching
app.use('/assets', function(req, res, next) {
  res.header('Surrogate-Control', 'max-age=2592000');
  next();
});

app.use('/assets', express.static(path.join(process.cwd(), 'assets')));

/**
 * Error handling
 */
app.use(require('lib/error-logger')({stack: true}));
app.use(require('lib/error-handler')());

/**
 * Listen
 */
var server = app.listen(config.port, function() {
  debug('listening on %d', config.port);
  app.emit('up', app, server);
});
app.emit('listen', app, server);

/**
 * Debugging
 */
require('debug-trace')({always: true});