var express = require('express');
var app = module.exports = express();
var Auth = app.model = require('./model');
app.actions = require('./actions');
app.middleware = require('./middleware');

var User = require('lib/User').model;
var middleware = require('lib/middleware');

// routes

app.post('/login'
  , middleware.lookup(User, {param: 'username', 404: false})
  , app.actions.login);

app.get('/logout'
  , app.actions.logout);