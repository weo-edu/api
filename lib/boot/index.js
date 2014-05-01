var path = require('path');
var mongoose = require('mongoose');
var express = require('express');
var debug = require('debug')('weo:boot');
var config = require('lib/config');

var app = module.exports = express();

// Global middleware
var cors = require('cors');
var compression = require('compression');
var bodyParser = require('body-parser');

debug('configuring express...');

if(app.get('env') === 'development') {
  debug('development mode');
  // Enable logging in dev mode
  app.use(require('morgan')());
};

/*
  Misc. startup
 */
// Generate our clientModels.js asset
require('lib/clientModels');

/**
 * Express middleware
 */

 // Enable CORS requests, since this is an API server
app.use(cors());

// Enable gzip compression
app.use(compression());

// Body parser
app.use(bodyParser());

/*
 * Install our primary app
 */
app.use(require('lib/main'));

// Serve static files in our public folder
app.use('/assets', express.static(path.join(process.cwd(), 'assets')));

/*
  Error handling
 */
app.use(require('lib/error-logger')({stack: true}));
app.use(require('lib/error-handler')());

app.listen(config.port, function() {
  debug('listening on %d', config.port);
});


debug('starting mongoose...');
mongoose.connect(config.mongo.url);