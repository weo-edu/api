var express = require('express');
var app = module.exports = express();
app.actions = require('./actions');
app.model = require('./model');
app.middleware = require('./middleware');

var lookup = require('lib/lookup');
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
  , lookup('Share')
  , app.middleware.isNotActive
  , app.actions.destroy);

app.patch('/:id/publish'
  , lookup('Share')
  , app.middleware.isActor
  , app.actions.publish);