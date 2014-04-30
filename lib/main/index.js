var mongoose = require('mongoose');
var express = require('express');

/**
 * Plugin registration
 */
mongoose.plugin(require('lib/created-at'));
mongoose.plugin(require('lib/enable-virtuals'));
mongoose.plugin(require('lib/schema-middleware'));
mongoose.plugin(require('lib/schema-track'));

/**
 * Resource Loading
 */

var app = module.exports = express();

app.use(require('lib/Auth'));
app.use('/s3', require('lib/S3'));
app.use('/user', require('lib/User'));
app.use('/student', require('lib/Student'));
app.use('/teacher', require('lib/Teacher'));
app.use('/group', require('lib/Group'));
app.use('/share', require('lib/Share'));
app.use('/assignment', require('lib/Assignment'));
app.use('/post', require('lib/Post'));


