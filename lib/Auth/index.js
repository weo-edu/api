var express = require('express');

var app = module.exports = express();

app.model = require('./model');
app.actions = require('./actions');
app.middleware = require('./middleware');

var user = require('lib/User');

app.use(app.middleware.token);
app.use(app.middleware.user);
app.use(app.middleware.passport);

// routes
app.post('/auth/login'
  , user.middleware.byUsernameOrEmail
  , app.middleware.checkPassword
  , app.actions.login);

app.get('/auth/logout'
  , app.actions.logout);

app.post('/auth/user'
  , app.actions.create);

app.post('/auth/google'
  , app.middleware.lookupByGoogle
  , app.middleware.googleCreateIfNew
  , app.actions.login);

app.post('/auth/clever'
  , app.middleware.lookupByClever
  , app.middleware.cleverCreateIfNew
  , app.actions.login);

app.put('/auth/login/google'
  , app.middleware.lookupByGoogle
  , app.actions.login);

app.put('/auth/login/clever'
  , app.middleware.lookupByClever
  , app.middleware.cleverCreateIfNew
  , app.actions.login);

app.post('/auth/link/google'
  , user.middleware.me()
  , app.actions.link);

app.get('/auth/unlink/google'
  , user.middleware.me()
  , app.actions.unlink);