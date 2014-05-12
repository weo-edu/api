var express = require('express');
var app = module.exports = express();
app.actions = require('./actions');
app.model = require('./model');

var lookup = require('lib/lookup');

var auth = require('lib/Auth');
var user = require('lib/User');
var object = require('lib/Object');


app.use(object);

app.patch('/:id/groups/:group/score'
  , auth.middleware.isAuthenticated
  , app.actions.score);


// Hooks
var hooks = require('./hooks');
user.model.schema.when('pre:change:groups', hooks.addStudent);
