var express = require('express');
var app = module.exports = express();
app.actions = require('./actions');
app.model = require('./model');
app.middleware = require('./middleware');

var auth = require('lib/Auth');
var group = require('lib/Group');
var share = require('lib/Share');

// User Routes

app.post('/'
  , app.actions.create);

app.get('/'
  , auth.middleware.user
  , app.actions.me);

app.get('/groups/:type?'
  , auth.middleware.isAuthenticated
  , app.middleware.me
  , app.actions.groups);

app.get('/shares'
  , auth.middleware.isAuthenticated
  , app.middleware.me
  , share.middleware.validateTo
  , share.actions.to);

app.get('/:id'
  , auth.middleware.isAuthenticated
  , app.actions.get);

app.patch('/'
  , auth.middleware.isAuthenticated
  , app.actions.updateMe);

app.patch('/avatar'
  , auth.middleware.isAuthenticated
  , app.middleware.me
  , app.actions.updateAvatar);