var express = require('express');
var app = module.exports = express();
app.actions = require('./actions');
app.model = require('./model');
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