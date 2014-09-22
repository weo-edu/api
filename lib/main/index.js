
/**
 * Initialize and connect to the database
 */

require('lib/db');


/**
 * Load Resources
 */

var auth = require('lib/Auth');
var s3 = require('lib/S3');
var user = require('lib/User');
var student = require('lib/Student');
var teacher = require('lib/Teacher');
var group = require('lib/Group');
var share = require('lib/Share');
var preference = require('lib/Preference');
require('lib/Object-Form');
require('lib/Object-Posts');
var io = require('lib/io');


/**
 * Create app
 */

var express = require('express');
var app = module.exports = express();

/**
 * Resource Mounts
 */
app.get('/', function(req, res) {
  res.send(200, 'up');
});

app.use(auth);
app.use('/s3', s3);
app.use('/user', user);
app.use('/student', student);
app.use('/teacher', teacher);
app.use('/group', group);
app.use('/share', share);
app.use('/preference', preference);

/**
 * Channel
 */


require('lib/Channel');

/**
 * Reputation
 */

require('lib/Reputation');

/**
 * Router IO Middleware
 */
io.use(require('lib/rio-tokens-middleware')());

/**
 * Router IO Mounts
 */
io.use('/share', share.io);
io.use('/group', group.io);

app.on('mount', function(app) {
  app.on('listen', function(app, server) {
    var sio = io.listen(server, {transports: ['polling']});
    sio.use(require('lib/sio-can-access')());
    sio.use(require('lib/sio-room-refcount')());
  });
});
