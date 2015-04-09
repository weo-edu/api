var express = require('express');
var app = module.exports = express();
app.actions = require('./actions');
app.middleware = require('./middleware');

var auth = require('lib/Auth');
var user = require('lib/User');

// Authenticated routes
app.use(auth.middleware.isAuthenticated);

app.post('/'
  , app.actions.create);

// Inherit from the User app
app.use(user);