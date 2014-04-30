var express = require('express');

var app = module.exports = express();

app.model = require('./model');
app.actions = require('./actions');
app.middleware = require('./middleware');

var middleware = require('lib/middleware');

app.use(app.middleware.token);
app.use(app.middleware.user);
app.use(app.middleware.passport);

// routes
app.post('/auth/login'
  , app.middleware.userByUsernameOrEmail
  , app.actions.login);

app.get('/auth/logout'
  , app.actions.logout);