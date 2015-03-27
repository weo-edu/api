var actions = module.exports;
var Auth = require('./model');
var moment = require('moment');
var mongoose = require('mongoose');
var Google = require('lib/google');
var errors = require('lib/errors');
var construct = require('lib/construct');
var _ = require('lodash');

actions.login = function(req, res, next) {
  if(! req.user) return next(errors.NotFound('User not found', 'username'));

  var user = req.user;
  user = user.toJSON();
  var data = _.pick(user, 'id', 'userType', 'username');
  data.username = data.username.toLowerCase();
  Auth.createToken(data, moment.duration(365, 'days').asSeconds(), function(err, token) {
    if(err) return next(err);
    user.token = token;
    res.json(user);
  });
};

actions.logout = function(req, res, next) {
  Auth.destroyToken(req.access_token, function(err) {
    if(err) return next(err);
    res.end();
  });
};

actions.create = function(req, res, next) {
  // Make sure we don't have empty string
  // for an email (i.e. if '' === req.body.email, we'd rather
  // have no email field at all)
  if(! req.body.email)
    delete req.body.email;

  var User = mongoose.model('User');
  var user = construct(User, req.body);

  user.save(function(err, user) {
    if(err) return next(err);

    req.user = user;

    res.status(201);
    actions.login(req, res, next);
  });
};

actions.unlink = function(req, res, next) {
  if(req.me.hasGoogle()) {
    req.me.auth.google.access_token = null;
    req.me.auth.google.refresh_token = null;
  }

  req.me.save(function(err) {
    if(err) return next(err);
    res.status(200).end();
  });
};

actions.link = function(req, res, next) {
  if(! req.me) return next(errors.NotFound('User not found'));

  var code = req.body.code;
  var redirectUri = req.body.redirectUri;
  Google.exchangeCodeForTokens({code: code, redirectUri: redirectUri}, function(err, tokens) {
    if(err) return next(err);

    req.me.auth.google.access_token = tokens.access_token;
    req.me.auth.google.refresh_token = tokens.refresh_token;

    req.me.save(function(err) {
      if(err) return next(err);
      res.status(200).end();
    });
  });
};