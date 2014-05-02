var express = require('express');
var app = module.exports = express();
app.actions = require('./actions');
var Share = app.model = require('./model');
app.middleware = require('./middleware');

var middleware = require('lib/middleware');

var auth = require('lib/Auth');
var user = require('lib/User');

/**
 * Express App
 */

app.post('/'
  , auth.middleware.isAuthenticated
  , user.middleware.me
  , app.middleware.authActor
  , app.actions.create);

app.del('/:id'
  , middleware.lookup('Share')
  , app.middleware.isNotActive
  , app.actions.destroy);

app.patch('/:id/publish'
  , middleware.lookup('Share')
  , app.middleware.isActor
  , app.actions.publish);




/**
 * RouterIO App
 */

var io = app.sockets = require('lib/routerware')();
var socketActions = require('./sockets');

io.post('/subscription'
  , user.middleware.me
  , app.middleware.validateAddresses
  , socketActions.subscribe)

io.del('/subscription'
  , user.middleware.me
  , app.middleware.validateAddresses
  , socketActions.unsubscribe);


/**
 * Hooks
 */

var hooks = require('./hooks');
Share.schema.when('post:add', hooks.broadcast(io, 'add'));
Share.schema.when('post:change', hooks.broadcast(io, 'change'));