var express = require('express');
var app = module.exports = express();
app.actions = require('./actions');
app.model = require('./model');
app.middleware = require('./middleware');


var auth = require('lib/Auth');
var user = require('lib/User');
var middleware = require('lib/middleware');


// global middleware
app.use(auth.middleware.isAuthenticated);

// routes

app.put('/join/:code'
  , user.middleware.me
  , middleware.lookup('Group', 'code')
  , app.actions.join);

app.post('/'
  , user.middleware.is('teacher')
  , app.actions.create);

app.get('/:id'
  , app.actions.get);

app.put('/:id'
  , middleware.lookup('Group')
  , app.middleware.isOwner
  , app.actions.update);

app.del('/:id'
  , middleware.lookup('Group')
  , app.middleware.isOwner
  , app.actions.destroy);

app.put('/:id/members'
  , auth.middleware.isAuthenticated
  , user.middleware.me
  , app.actions.addUser);

app.patch('/:id/archive'
  , auth.middleware.isAuthenticated
  , middleware.lookup('Group')
  , app.middleware.isOwner
  , app.actions.archive);