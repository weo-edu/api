var express = require('express');
var app = module.exports = express();
app.actions = require('./actions');
var Student = app.model = require('./model');
app.middleware = require('./middleware');

var teacher = require('lib/Teacher');
var lookup = require('lib/lookup');
var auth = require('lib/Auth');

app.post('/'
  , app.actions.create);

// Authenticated routes
app.use(auth.middleware.isAuthenticated);

// Only a student's teacher's may arbitrarily reset that student's password
app.patch('/:id/password'
  , lookup(Student)
  , teacher.middleware.isTeacherOf
  , app.actions.setPassword);

// Inherit from the User app
app.use(require('lib/User'));
