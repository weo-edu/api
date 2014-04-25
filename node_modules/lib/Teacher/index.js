var express = require('express');
var app = module.exports = express();
var Teacher = app.model = require('./model');
var actions = app.actions = require('./actions');
app.middleware = require('./middleware');


// Teacher-specific controller actions
app.post('/', app.actions.create);

// Inherit our controller actions from lib/User as well
app.use(require('lib/User'));
