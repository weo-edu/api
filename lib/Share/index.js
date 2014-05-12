var express = require('express');
var app = module.exports = express();

app.actions = require('./actions');
var Share = app.model = require('./model');
app.middleware = require('./middleware');

var lookup = require('lib/lookup');
var auth = require('lib/Auth');
var user = require('lib/User');

/**
 * Express App
 */

app.post('/'
  , auth.middleware.isAuthenticated
  , user.middleware.me
  , app.middleware.authActor
  , app.middleware.resolveAccess
  , app.actions.create);

app.del('/:id'
  , lookup('Share')
  , app.middleware.isNotActive
  , app.actions.destroy);

app.patch('/:id/publish'
  , lookup('Share')
  , app.middleware.isActor
  , app.actions.publish);

app.get('/:id', app.actions.get);


/**
 * RouterIO App
 */

var io = app.io = require('lib/routerware')();
var ioActions = require('./io');

io.post('/subscription'
  , user.middleware.me
  , app.middleware.validateBoard
  , ioActions.subscribe)

io.del('/subscription'
  , user.middleware.me
  , app.middleware.validateBoard
  , ioActions.unsubscribe);


/**
 * Hooks
 */

var hooks = require('./hooks');

Share.schema.when('post:add', hooks.broadcast(io, 'add'));
Share.schema.when('post:change', hooks.broadcast(io, 'change'));
Share.schema.when('pre:add', 'pre:change:status', 'pre:change:to', hooks.denyPending());
Share.schema.when('pre:add', 'pre:change:status', hooks.setPublished());
