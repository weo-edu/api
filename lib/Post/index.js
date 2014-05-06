var express = require('express');
var app = module.exports = express();
app.actions = require('./actions');
app.model = require('./model');

var lookup = require('lib/lookup');

var auth = require('lib/Auth');
var user = require('lib/User');
var share = require('lib/Share');

// Share Routes

app.post('/'
  , auth.middleware.isAuthenticated
  , user.middleware.me
  , share.middleware.authActor
  , share.middleware.resolveParentTo
  , app.actions.create);

app.get('/:id', app.actions.get);
