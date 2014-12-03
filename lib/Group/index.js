var express = require('express');
var app = module.exports = express();

// ensure schema plugin events
var ensurePlugin = require('lib/ensure-plugin');
ensurePlugin(require('lib/schema-plugin-events'));

var Group = app.model = require('./model');
app.actions = require('./actions');
app.middleware = require('./middleware');


var auth = require('lib/Auth');
var user = require('lib/User');
var lookup = require('lib/lookup');
var lock = require('lib/lock');

// Unauthenticated route
app.get('/lookup/:code'
  , app.middleware.lookupByCode()
  , app.actions.lookup);

// Everything below this point requires authentication
app.use(auth.middleware.isAuthenticated);

// routes

app.put('/join/:code'
  , user.middleware.me()
  , app.middleware.lookupByCode()
  , app.actions.join);

app.post('/'
  , user.middleware.me()
  , user.middleware.is('teacher')
  , app.actions.create);

app.get('/students'
  , app.actions.studentsInGroups);

app.get('/:id'
  , lookup(Group, {lean: true})
  , app.actions.get);

app.put('/:id'
  , lookup(Group)
  , app.middleware.isOwner
  , app.actions.update);

app.del('/:id'
  , lookup(Group)
  , app.middleware.isOwner
  , app.actions.destroy);

app.put('/:id/members/:userId'
  , auth.middleware.isAuthenticated
  , lock.middleware('userId')
  , lookup(user.model, {param: 'userId', key: '_id'})
  , lookup(Group)
  , app.actions.addUser);

app.del('/:id/members/:userId'
  , auth.middleware.isAuthenticated
  , lock.middleware('userId')
  , lookup(user.model, {param: 'userId', key: '_id'})
  , lookup(Group)
  , app.actions.removeUser);

app.put('/:id/archive'
  , auth.middleware.isAuthenticated
  , lookup(Group)
  , app.middleware.isOwner
  , app.actions.archive);

/**
 * RouterIO app
 */
var io = app.io = require('lib/routerware')();
var ioActions = require('./io');

io.post('/students/subscription'
  , user.middleware.me()
  , app.middleware.belongsTo('group')
  , ioActions.subscribe);

io.del('/students/subscription'
  , user.middleware.me()
  , app.middleware.belongsTo('group')
  , ioActions.unsubscribe);

/**
 * Foreign references
 */
Group
  .ref('User', 'groups')
  .ref('Group', 'parent')
  .ref('Share', 'contexts.descriptor');

/**
 * Hooks
 */
var hooks = require('./hooks');

Group.schema.when('pre:validate', hooks.addAccessCode());
// Make sure that group owners are also members of their groups
Group.schema.when('pre:add', 'pre:change:owners', hooks.inductOwners());
Group.schema.when('post:remove', hooks.dismissMembers());
Group.schema.when('post:add', hooks.groupCodeTip());
Group.schema.when('join', hooks.broadcastJoin());
Group.schema.when('leave', hooks.broadcastLeave());
Group.schema.when('pre:change:status', hooks.archiveSubgroups());