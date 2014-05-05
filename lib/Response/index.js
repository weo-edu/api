var express = require('express');
var app = module.exports = express();
app.actions = require('./actions');
app.model = require('./model');

var auth = require('lib/Auth');
var user = require('lib/User');
var share = require('lib/Share');

/**
 * Express App
 */

app.post('/'
  , auth.middleware.isAuthenticated
  , user.middleware.me
  , share.middleware.authActor
  , app.actions.create);

app.get('/:id', app.actions.get);
app.patch('/:id', app.actions.update);


