var express = require('express');
var app = module.exports = express();
app.actions = require('./actions');
app.middleware = require('./middleware');
app.model = require('./model');

var auth = require('lib/Auth');
var user = require('lib/User');
var share = require('lib/Share');

app.patch('/:id'
  , app.middleware.share
  , app.actions.update);

app.get('/:id'
  , app.middleware.share
  , app.actions.get);

app.post('/'
  , auth.middleware.isAuthenticated
  , user.middleware.me
  , app.middleware.toShare
  , share.middleware.authActor
  , share.middleware.resolveAccess
  , share.actions.create);



