var express = require('express');
var app = module.exports = express();
var Assignment = app.model = require('./model');
app.actions = require('./actions');

var group = require('lib/Group');
var object = require('lib/Object');

app.use(object);

app.patch('/:id/groups/:group/score'
  , app.actions.score);


// Hooks
var hooks = require('./hooks');
group.model.schema.when('join', hooks.addStudent);
