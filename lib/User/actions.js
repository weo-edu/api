var User = require('./model');
var Group = require('lib/Group/model');
var actions = module.exports;
var errors = require('lib/errors');

actions.me = function(req, res) {
  res.json(req.me);
};

actions.updateMe = function(req, res, next) {
  if(! req.auth) return next(errors.NotFound());
  req.params.id = req.auth.id;
  actions.update(req, res, next);
};

actions.groups = function(req, res, next) {
  Group.find()
    .where('_id').in(req.me.groupIds)
    .where('status', 'active')
    .lean()
    .exec(function(err, groups) {
      if(err) return next(err);
      res.json(groups);
    });
};

actions.updateAvatar = function(req, res, next) {
  var imageUrl = req.param('image');
  if(! imageUrl) {
    return next(errors.Client('Missing image')
        .error('required', 'image'));
  }

  req.me.setAvatar(imageUrl, function(err) {
    err ? next(err) : res.send(204);
  });
};

actions.reputation = function(req, res) {
  var actor = req.me.toKey();
  actor.reputation = req.me.reputation.canonicalTotal.points;
  res.json(200, actor);
};



var mail = require('lib/mail');
var token = require('lib/token');
var config = require('lib/config');
var qs = require('qs');
var ent = require('ent');
actions.forgot = function(req, res, next) {
  var user = req.user;
  var loginToken = token.generate();
  var uri = config.frontEnd + '/?' +  qs.stringify({token: loginToken});
  var html = [
    'Click this link to reset your password:\r\n',
    '<br>',
    '<a href="' + encodeURI(uri) + '">',
    ent.encode(uri),
    '</a>',
    ''
  ].join('\r\n');

  user.reset.token = loginToken;
  user.reset.createdAt = new Date;

  user.save(function(err) {
    if (err)
      return next(err);
    mail.send({
      from: 'Weo Info <info@weo.io>',
      to: user.email,
      subject: 'Password Reset',
      html: html
    }, function(err) {
      if (err)
        next(err);
      else
        res.send(204);
    });
  });
};

actions.reset = function(req, res, next) {
  var token = req.param('token');
  var password = req.param('password');
  User.findOne({'reset.token': decodeURIComponent(token)}, function(err, user) {
    if (err) return next(err);
    if (!user) return next(new Error('invalid token'));
    user.password = password;
    user.save(function(err) {
      if (err) next(err);
      res.send(204);
    });
  });
};

actions.editField = function(field) {
  return function(req, res, next) {
    req.user[field] = req.param(field);
    req.user.save(function(err, user) {
      err
        ? next(err)
        : res.send(200, user);
    });
  };
};

require('lib/crud')(actions, User);