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

/**
 * Misc. startup
 */
require('lib/clientModels');

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
  app.emit('up', app);
});
app.emit('listen', app, server);


debug('starting mongoose...');
mongoose.connect(config.mongo.url);

require('debug-trace')({always: true});
