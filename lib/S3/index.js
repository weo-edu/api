var express = require('express');
var app = module.exports = express();
app.actions = require('./actions');

var user = require('lib/User');
var auth = require('lib/Auth');

/**
 * Routes
 */

app.post('/upload'
  , auth.middleware.isAuthenticated
  , user.middleware.me()
  , app.actions.upload);

app.post('/avatar'
  , auth.middleware.isAuthenticated
  , user.middleware.me()
  , app.actions.avatar);