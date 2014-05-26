var express = require('express');
var app = module.exports = express();

app.actions = require('./actions');
var Share = app.model = require('./model');
app.middleware = require('./middleware');

var lookup = require('lib/lookup');
var auth = require('lib/Auth');
var user = require('lib/User');

app.use(auth.middleware.isAuthenticated);

/**
 * Express App
 */

 app.put('/:id/published'
   , lookup(Share)
   , app.middleware.isActor(Share)
   , app.actions.publish);

app.get('/:id'
  , user.middleware.me()
  , app.actions.get);

app.post('/'
  , user.middleware.me()
  , app.middleware.authActor
  , app.middleware.resolveAccess
  , app.middleware.deleteContent
  , app.actions.create);

app.del('/:id'
  , lookup(Share)
  , app.middleware.isNotActive
  , app.middleware.isActor(Share)
  , app.actions.destroy);

app.patch('/:id'
  , lookup(Share)
  , app.middleware.isActor(Share)
  , app.actions.update);

app.patch('/:id/publish'
  , lookup(Share)
  , app.middleware.isActor(Share)
  , app.actions.publish);

app.get('/'
  , user.middleware.me()
  , app.middleware.validateBoard
  , app.actions.to);

/**
 * RouterIO App
 */
var io = app.io = require('lib/routerware')();
var ioActions = require('./io');

io.post('/subscription'
  , user.middleware.me()
  , app.middleware.validateBoard
  , ioActions.subscribe)

io.del('/subscription'
  , user.middleware.me()
  , app.middleware.validateBoard
  , ioActions.unsubscribe);


/**
 * Hooks
 */

var hooks = require('./hooks');

//recursive object generators
Share.schema.when('pre:validate', hooks.generateId());

Share.schema.when('post:add', hooks.broadcast('add'));
Share.schema.when('post:change', hooks.broadcast('change'));
Share.schema.when('post:remove', hooks.broadcast('remove'));

Share.schema.when('pre:add', 'pre:change:status', 'pre:change:to', hooks.denyPending());
Share.schema.when('pre:add', 'pre:change:status', hooks.setPublished());

Share.schema.when('post:add', hooks.aggregateChannel());
