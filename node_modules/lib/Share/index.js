var express = require('express');
var app = module.exports = express();
var Share = app.model = require('./model');
app.actions = require('./actions');
app.middleware = require('./middleware');

var middleware = require('lib/middleware');

// routes

app.post('/'
  , app.actions.create);

app.post('/subscription'
  , app.actions.subscribe);

app.del('/subscription'
  , app.actions.unsubscribe);

app.del('/:id'
  , middleware.lookup(Share)
  , app.middleware.isNotActive
  , app.actions.destroy);

app.patch('/:id/publish'
  , middleware.lookup(Share)
  , app.middleware.isActor
  , app.actions.publish);