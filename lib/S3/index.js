var express = require('express');
var app = module.exports = express();
var S3 = app.model = require('./model');
app.actions = require('./actions');
app.middleware = require('./middleware');

var auth = require('lib/Auth');
var middleware = require('lib/middleware');

// routes
app.post('/upload'
  , auth.middleware.isAuthenticated
  , app.actions.upload);

app.put('/upload/:id/complete'
  , auth.middleware.isAuthenticated
  , middleware.lookup(S3)
  , app.actions.complete);

app.get('/:id'
  , app.actions.get);