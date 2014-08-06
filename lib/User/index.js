var express = require('express');
var app = module.exports = express();

// ensure schema plugin events
var ensurePlugin = require('lib/ensure-plugin');
ensurePlugin(require('lib/schema-plugin-events'));

var User = app.model = require('./model');
app.actions = require('./actions');
app.middleware = require('./middleware');

var auth = require('lib/Auth');
var lookup = require('lib/lookup');

// User Routes

// Unauthenticated routes
app.post('/'
  , app.actions.create);

app.get('/'
  , auth.middleware.user
  , app.middleware.me(true)
  , app.actions.me);

// Authenticated routes
app.use(auth.middleware.isAuthenticated);

app.get('/groups/:type?'
  , app.middleware.me()
  , app.actions.groups);

app.get('/:id'
  , lookup(User)
  , app.actions.get);

app.patch('/'
  , app.middleware.me(false, 'user')
  , app.actions.updateMe);

app.patch('/avatar'
  , app.middleware.me()
  , app.actions.updateAvatar);

/**
 * Foreign references
 */
User
  .ref('Group', 'owners')
  .ref('S3', 'actor')
  .ref('Share', 'actor');

/**
 * Hooks
 */
var hooks = require('./hooks');
User.schema.when('pre:add', 'pre:change:password', hooks.hashPassword());
User.schema.when('post:add', 'post:change:groups', hooks.emitJoinLeave());
User.schema.when('post:add', hooks.createAvatar());
User.schema.when('pre:validate', hooks.displayName());