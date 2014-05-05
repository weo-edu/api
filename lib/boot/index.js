var path = require('path');
var mongoose = require('mongoose');
var express = require('express');
var debug = require('debug')('weo:boot');
var config = require('lib/config');
var boot = require('lib/boot-emitter');

var app = module.exports = express();

// Global middleware
var cors = require('cors');
var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');

debug('configuring express...');

if(app.get('env') === 'development') {
  debug('development mode');
  // Enable logging in dev mode
  app.use(morgan());
};


/**
 * Express middleware
 */
  
boot.emit('middleware', app);

 // Enable CORS requests, since this is an API server
app.use(cors());

// Enable gzip compression
app.use(compression());

// Body parser
app.use(bodyParser());


boot.emit('main', app);

// Install our primary app
app.use(require('lib/main'));

boot.emit('static', app);

// Serve static files in our public folder
app.use(express.static(path.join(process.cwd(), 'public')));

boot.emit('errors', app);

app.use(require('lib/middleware').errorLogging());
app.use(require('lib/mongoose-error'));

var server = app.listen(config.port, function() {
  debug('listening on %d', config.port);
  boot.emit('up', app);
});
boot.emit('listen', app, server);


debug('starting mongoose...');
mongoose.connect(config.mongo.url);

require('debug-trace')({always: true});