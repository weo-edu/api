var User = require('./model');
var Group = require('lib/Group/model');
var errors = require('lib/errors');
var mail = require('lib/mail');
var config = require('lib/config');
var crypto = require('crypto');
var qs = require('qs');
var ent = require('ent');

exports.me = function(req, res) {
  res.json(req.me);
};

exports.updateMe = function(req, res, next) {
  if(! req.auth) return next(errors.NotFound());
  req.params.id = req.auth.id;
  exports.update(req, res, next);
};


exports.groups = function(groupType) {
  return function(req, res, next) {
    var user = req.me || req.user;
    Group.find()
      .where('_id').in(user.groupIds)
      .where('status', 'active')
      .where('groupType', groupType)
      .lean()
      .exec(function(err, groups) {
        if(err) return next(err);
        res.json(groups);
      });
  };
};

exports.updateAvatar = function(req, res, next) {
  var imageUrl = req.param('image');
  if(! imageUrl) {
    return next(errors.Client('Missing image')
        .error('required', 'image'));
  }

  req.me.setAvatar(imageUrl, function(err) {
    err ? next(err) : res.send(204);
  });
};

exports.forgot = function(req, res, next) {
  var user = req.user;
  crypto.randomBytes(16, function(err, buf) {
    if(err) return next(err);

    var token = buf.toString('base64').slice(0, -2);

    user.reset.token = token;
    user.reset.createdAt = new Date;

    user.save(function(err) {
      if (err) return next(err);

      sendForgotPasswordEmail({
        to: user.email,
        token: token
      }, function(err) {
        err ? next(err) : res.send(204);
      });
    });
  });
};

function sendForgotPasswordEmail(opts) {
  var uri = config.frontEnd + '/reset?' +  qs.stringify({token: opts.token});
  var html = [
    'Click this link to reset your password:\r\n',
    '<br>',
    '<a href="' + encodeURI(uri) + '">',
    ent.encode(uri),
    '</a>',
    ''
  ].join('\r\n');

  mail.send({
    from: 'Weo Info <info@weo.io>',
    to: to,
    subject: 'Password Reset',
    html: html
  })
}

exports.editPassword = function(req, res, next) {
  var password = req.param('password');
  var isTemporary = req.user.isStudent() && (req.me.id !== req.user.id);

  req.user.password = password;
  req.user.tmpPassword = isTemporary ? password : '';

  req.user.save(function(err, user) {
    err
     ? next(err)
     : res.send(200, user);
  });
};

exports.editField = function(field) {
  return function(req, res, next) {
    req.user[field] = req.param(field);
    req.user.save(function(err, user) {
      err
        ? next(err)
        : res.send(200, user);
    });
  };
};

require('lib/crud')(exports, User);