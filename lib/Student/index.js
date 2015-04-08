var express = require('express');
var app = module.exports = express();
app.actions = require('./actions');
var Student = app.model = require('./model');
app.middleware = require('./middleware');

var teacher = require('lib/Teacher');
var lookup = require('lib/lookup');
var auth = require('lib/Auth');
var user = require('lib/User');

// Authenticated routes
app.use(auth.middleware.isAuthenticated);

// Only a student's teacher's may arbitrarily reset that student's password
app.put('/:id/password'
  , user.middleware.me()
  , lookup(Student)
  , teacher.middleware.isTeacherOf
  , app.actions.setPassword);

app.put('/:id/username'
  , user.middleware.me()
  , lookup(Student)
  , teacher.middleware.isTeacherOf
  , app.actions.setUsername);

app.put('/:id/username'
  , user.middleware.me()
  , lookup(Student)
  , teacher.middleware.isTeacherOf
  , app.actions.setDisplayName);

app.post('/'
  , app.actions.create);

// Inherit from the User app
app.use(user);