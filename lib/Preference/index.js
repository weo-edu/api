var express = require('express');
var app = module.exports = express();
app.actions = require('./actions');
app.middleware = require('./middleware');

var auth = require('lib/Auth');
var user = require('lib/User');

// global middleware
app.use(auth.middleware.isAuthenticated);
app.use(user.middleware.me);

// routes

app.get('/?:name'
  , app.actions.get);

app.put('/:name'
  , app.actions.set);