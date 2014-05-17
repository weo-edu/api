var express = require('express');
var app = module.exports = express();

// ensure schema plugin events
var ensurePlugin = require('lib/ensure-plugin');
ensurePlugin(require('lib/schema-plugin-events'));

var User = app.model = require('./model');
app.actions = require('./actions');
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
  , share.middleware.validateBoard
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


/**
 * Hooks
 */
var hooks = require('./hooks');
User.schema.when('pre:add', 'pre:change:password', hooks.hashPassword());
User.schema.when('post:add', hooks.createAvatar);