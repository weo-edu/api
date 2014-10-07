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
var selfLink = require('lib/schema-plugin-selflink');

// User Routes

// Unauthenticated routes
app.post('/'
  , app.actions.create);

app.get('/'
  , app.middleware.me(true)
  , selfLink.middleware('me', {404: false})
  , app.actions.me);

app.post('/forgot'
  , app.middleware.byUsernameOrEmail
  , app.actions.forgot);

app.patch('/reset'
  , app.actions.reset);

// Authenticated routes
app.use(auth.middleware.isAuthenticated);

app.get('/groups/:type?'
  , auth.middleware.user
  , app.middleware.me()
  , app.actions.groups);

app.get('/reputation'
  , app.middleware.me(true)
  , app.actions.reputation);

app.get('/:id'
  , lookup(User)
  , selfLink.middleware(User)
  , app.actions.get);

app.patch('/'
  , app.middleware.me(false, 'user')
  , app.actions.updateMe);

app.patch('/avatar'
  , app.middleware.me()
  , app.actions.updateAvatar);

app.patch('/:id/password'
  , lookup(User)
  , app.middleware.me()
  , app.middleware.canEditUser('password')
  , app.actions.editField('password'));

app.patch('/:id/username'
  , lookup(User)
  , app.middleware.me()
  , app.middleware.canEditUser('username')
  , app.actions.editField('username'));

app.patch('/:id/displayName'
  , lookup(User)
  , app.middleware.me()
  , app.middleware.canEditUser('displayName')
  , app.actions.editField('displayName'));

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


User.schema.when('pre:change:avatar', hooks.emitProfile('pre', 'avatar'));
User.schema.when('post:change:avatar', hooks.emitProfile('post', 'avatar'));

User.schema.when('pre:change:displayName', hooks.emitProfile('pre', 'displayName'));
User.schema.when('post:change:displayName', hooks.emitProfile('post', 'displayName'));

User.schema.when('pre:change:aboutMe', hooks.emitProfile('pre', 'aboutMe'));
User.schema.when('post:change:aboutMe', hooks.emitProfile('post', 'aboutMe'));

User.schema.when('pre:change:color', hooks.emitProfile('pre', 'color'));
User.schema.when('post:change:color', hooks.emitProfile('post', 'color'));
