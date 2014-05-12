var express = require('express');
var app = module.exports = express();
var Post = app.model = require('./model');
app.actions = require('./actions');

var lookup = require('lib/lookup');
var auth = require('lib/Auth');
var user = require('lib/User');
var share = require('lib/Share');

// All routes in this controller require auth
app.use(auth.middleware.isAuthenticated);

// Share Routes
app.post('/'
  , user.middleware.me()
  , share.middleware.authActor
  , share.middleware.resolveParentTo
  , share.middleware.deleteContent
  , app.actions.create);

app.get('/:id'
  , lookup(Post)
  , app.actions.get);

app.patch('/:id'
  , lookup(Post)
  , share.middleware.isActor(Post)
  , app.actions.update);