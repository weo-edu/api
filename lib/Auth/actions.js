var actions = module.exports;
var Auth = require('./model');
var moment = require('moment');
var mongoose = require('mongoose');
var google = require('lib/google');
var _ = require('lodash');

actions.login = function(req, res, next) {
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
  // for an email
  if(! req.body.email)
    delete req.body.email;

  var User = mongoose.model('User');
  var user = new User(req.body);

  user.save(function(err, user) {
    if(err) return next(err);

    req.user = user;

    res.status(201);
    actions.login(req, res, next);
  });
};

actions.unlink = function(req, res, next) {
  if(req.me.hasGoogle())
    req.me.auth.google = null;

  req.me.save(function(err) {
    if(err) return next(err);
    res.status(200).end();
  });
};

actions.link = function(req, res, next) {
  google.getUser(req.body, function(err, profile) {
    if(err) return next(err);

    req.me.linkToGoogle(profile);
    req.me.save(function(err) {
      if(err) return next(err);

      res.status(200).end();
    });
  });
};