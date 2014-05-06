var express = require('express');
var app = module.exports = express();
app.actions = require('./actions');
app.model = require('./model');
app.middleware = require('./middleware');

var auth = require('lib/Auth');
var lookup = require('lib/lookup');

// routes
app.post('/upload'
  , auth.middleware.isAuthenticated
  , app.actions.upload);

app.put('/upload/:id/complete'
  , auth.middleware.isAuthenticated
  , lookup('S3')
  , app.actions.complete);

app.get('/:id'
  , app.actions.get);

