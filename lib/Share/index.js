var express = require('express');
var app = module.exports = express();
app.actions = require('./actions');
app.model = require('./model');
app.middleware = require('./middleware');

var middleware = require('lib/middleware');

var auth = require('lib/Auth');
var user = require('lib/User');

// Share Routes

app.post('/'
  , auth.middleware.isAuthenticated
  , user.middleware.me
  , app.middleware.authActor
  , app.actions.create);

app.post('/subscription'
  , app.actions.subscribe);

app.del('/subscription'
  , app.actions.unsubscribe);

app.del('/:id'
  , middleware.lookup('Share')
  , app.middleware.isNotActive
  , app.actions.destroy);

app.patch('/:id/publish'
  , middleware.lookup('Share')
  , app.middleware.isActor
  , app.actions.publish);