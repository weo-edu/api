var path = require('path');
var mongoose = require('mongoose');
var express = require('express');
var debug = require('debug')('weo:boot');
var config = require('lib/config');
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

/*
  Mongoose setup/config
 */
mongoose.plugin(require('lib/created-at'));
mongoose.plugin(require('lib/enable-virtuals'));

/*
  Express middleware
 */

// Enable CORS requests, since this is an API server
app.use(cors());

// Enable gzip compression
app.use(compression());

// Body parser
app.use(bodyParser());

// Mongoose error handling
app.use(require('lib/mongoose-error'));

/*
  Startup our app
 */

// Install our primary app
app.use(require('lib/main'));

// Serve static files in our public folder
app.use(express.static(path.join(process.cwd(), 'public')));

app.listen(config.port, function() {
  debug('listening on %d', config.port);
});


debug('starting mongoose...');
mongoose.connect(config.mongo.url);