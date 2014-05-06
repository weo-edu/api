

/**
 * Plugin registration
 */

var mongoose = require('mongoose');
mongoose.plugin(require('lib/created-at'));
mongoose.plugin(require('lib/enable-virtuals'));
mongoose.plugin(require('lib/schema-events'));


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
var assignment = require('lib/Assignment');
var post = require('lib/Post');
var io = require('lib/io');


/**
 * Create app
 */

var express = require('express');
var app = module.exports = express();

/**
 * IO Middleware
 */

app.use(io.middleware);

/**
 * Resource Mounts
 */

app.use(auth);
app.use('/s3', s3);
app.use('/user', user);
app.use('/student', student);
app.use('/teacher', teacher);
app.use('/group', group);
app.use('/share', share);
app.use('/assignment', assignment);
app.use('/post', post);

/**
 * Router IO Mounts
 */

io.use('/share', share.io);

app.on('mount', function(app) {
  app.on('listen', function(app, server) {
    io.listen(server);
  });
});