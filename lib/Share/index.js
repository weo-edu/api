/**
 * Modules
 */

var express = require('express');
var app = module.exports = express();

/**
 * Locals
 */

app.actions = require('./actions');
var Share = app.model = require('./model');
app.middleware = require('./middleware');

/**
 * Libs
 */

var lookup = require('lib/lookup');
var auth = require('lib/Auth');
var user = require('lib/User');
var User = user.model;
var pageToken = require('lib/page-token');
var selfLink = require('lib/schema-plugin-selflink');

/**
 * System Shares
 */

require('./Profile');

/**
 * Middleware
 */

app.use(auth.middleware.isAuthenticated);

/**
 * API
 */

/**
 * @api {put} /share/:id/published
 * @apiGroup Share
 *
 * @apiParam id unique id of the share to be published
 *
 * @apiDescription Publish the share referenced by `id`
 */
app.put('/:id/published'
   , lookup(Share)
   , app.middleware.canEdit(Share)
   , app.actions.publish);

/**
 * @api {get} /share/:id/members
 * @apiGroup Share
 *
 * @apiParam {String} id unique id of the share to be published
 * @apiParam {[String]} context List of contexts ids (a single context may also be passed)
 *
 * @apiDescription Retrieve the list of students who have access to this
 * share in the contexts specified by `context`
 */
app.get('/:id/members'
  , lookup(Share)
  , app.actions.getMembers);

/**
 * @api {get} /share/:id/contexts
 * @apiGroup Share
 *
 * @apiParam {String} id unique id of the share
 *
 * @apiDescription Retrieve the list of contexts this share
 * has been sent to, intersected with the list of contexts
 * that the requesting user belongs to.
 */
app.get('/:id/contexts'
  , user.middleware.me()
  , lookup(Share)
  , app.actions.getContexts);

app.get('/:id'
  , lookup(Share)
  , app.middleware.me()
  , selfLink.middleware(Share)
  , app.actions.get);

app.get('/:id/me'
  , lookup(Share)
  , app.middleware.me(true, 'user')
  , app.middleware.getInstance()
  , selfLink.middleware(Share)
  , app.actions.get);

app.get('/:id/:user'
  , lookup(Share)
  , lookup(user.model, 'user')
  , app.middleware.getInstance()
  , selfLink.middleware(Share)
  , app.actions.get);

app.post('/'
  , user.middleware.me()
  , app.middleware.authActor
  , app.middleware.resolveDefaultAccess
  , app.middleware.deleteContent
  , app.middleware.addUserChannel
  , app.actions.create);

app.del('/:id'
  , lookup(Share)
  , app.middleware.canEdit(Share)
  , app.actions.destroy);

app.patch('/:id'
  , lookup(Share)
  , user.middleware.me()
  , app.middleware.canEdit(Share)
  , app.middleware.deleteContent
  , app.middleware.addUserChannel
  , app.actions.update);

app.get('/'
  , user.middleware.me()
  , pageToken(20)
  , app.actions.to);

/**
 * RouterIO App
 */
var io = app.io = require('lib/routerware')();
var ioActions = require('./io');

io.post('/subscription'
  , user.middleware.me()
  , ioActions.subscribe);

io.del('/subscription'
  , user.middleware.me()
  , ioActions.unsubscribe);

/**
 * Foreign references
 */
Share.ref('Share', 'root');


/**
 * Hooks
 */

var hooks = require('./hooks');

//recursive object generators
Share.schema.when('pre:validate', hooks.generateId());

Share.schema.when('post:add', hooks.broadcast('add'));
Share.schema.when('post:change', hooks.broadcast('change'));
Share.schema.when('post:remove', hooks.broadcast('remove'));

Share.schema.when('pre:add', 'pre:change:status', 'pre:change:to', hooks.denyPendingAndUndenyActive());
Share.schema.when('pre:add', 'pre:change:status', hooks.setPublishedAt());

Share.schema.when('post:add', hooks.aggregateChannel());


Share.schema.when('pre:add', hooks.dispatchObjectType());



User.schema.when('profile', hooks.createProfileShare('pre'));
