var express = require('express');
var app = module.exports = express();
var Group = app.model = require('./model');
app.actions = require('./actions');
app.middleware = require('./middleware');


var auth = require('lib/Auth');
var user = require('lib/User');
var group = require('lib/Group');
var lookup = require('lib/lookup');

// Unauthenticated route
app.get('/lookup/:code'
  , lookup('Group', 'code')
  , app.actions.lookup);

// Everything below this point requires authentication
app.use(auth.middleware.isAuthenticated);

// routes

app.put('/join/:code'
  , user.middleware.me
  , lookup('Group', 'code')
  , app.actions.join);

app.post('/'
  , user.middleware.is('teacher')
  , app.actions.create);

app.get('/students'
  , user.middleware.is('teacher')
  , app.actions.studentsInGroups);

app.get('/:id'
  , app.actions.get);

app.put('/:id'
  , lookup('Group')
  , app.middleware.isOwner
  , app.actions.update);

app.del('/:id'
  , lookup('Group')
  , app.middleware.isOwner
  , app.actions.destroy);

app.put('/:id/members'
  , auth.middleware.isAuthenticated
  , user.middleware.me
  , group.middleware.exists('id')
  , app.actions.addUser);

app.patch('/:id/archive'
  , auth.middleware.isAuthenticated
  , lookup('Group')
  , app.middleware.isOwner
  , app.actions.archive);


/**
 * Hooks
 */
var hooks = require('./hooks');
Group.schema.when('pre:validate', hooks.addAccessCode());
// Make sure that group owners are also members of their groups
Group.schema.when('pre:add', 'change:owners', hooks.inductOwners());
Group.schema.when('post:remove', hooks.dismissMembers());
Group.schema.when('pre:add', hooks.groupCodeTip());