var express = require('express');
var app = module.exports = express();
var Assignment = app.model = require('./model');
app.actions = require('./actions');

var lookup = require('lib/lookup');

var auth = require('lib/Auth');
var user = require('lib/User');
var share = require('lib/Share');
var group = require('lib/Group');

// Share Routes
// Authenticated routes
app.use(auth.middleware.isAuthenticated);

app.post('/'
  , user.middleware.me()
  , share.middleware.authActor
  , share.middleware.resolveParentTo
  , app.actions.create);

app.get('/:id'
  , lookup(Assignment)
  , app.actions.get);

app.patch('/:id/groups/:group/score'
  , app.actions.score);


// Hooks
var hooks = require('./hooks');
group.model.schema.when('join', hooks.addStudent);
