var express = require('express');
var app = module.exports = express();
app.actions = require('./actions');
app.model = require('./model');
app.middleware = require('./middleware');

// Inherit our controller actions from lib/User as well
app.use(require('lib/User'));
