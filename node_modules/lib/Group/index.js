var express = require('express');
var app = module.exports = express();
var Group = app.model = require('./model');
app.actions = require('./actions');
app.middleware = require('./middleware');

var auth = require('lib/Auth');
var user = require('lib/User');
var middleware = require('lib/middleware');
var student = require('lib/Student');
var teacher = require('lib/Teacher');

// global middleware

app.use(auth.middleware.isAuthenticated);

// routes

app.put('/join/:code'
  , middleware.lookup(Group, 'code')
  , app.actions.join);

app.post('/'
  , user.middleware.is('teacher')
  , app.actions.create);

app.get('/:id'
  , app.actions.get);

app.put('/:id'
  , middleware.lookup(Group)
  , app.middleware.isOwner
  , app.actions.update);

app.del('/:id'
  , middleware.lookup(Group)
  , app.middleware.isOwner
  , app.actions.destroy);

app.put('/:id/members/:user'
  , auth.middleware.isAuthenticated
  , user.middleware.is('teacher')
  , middleware.lookup(Group)
  , app.middleware.isOwner
  , middleware.lookup(student.model, {param: 'user', key: 'id', prop: 'student'})
  , app.actions.addUser);

app.patch('/:id/archive'
  , auth.middleware.isAuthenticated
  , middleware.lookup(Group)
  , app.middleware.isOwner
  , app.actions.archive);