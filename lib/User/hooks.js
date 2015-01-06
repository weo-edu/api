var passwordHash = require('password-hash');
var config = require('lib/config');
var _ = require('lodash');
var Group = require('lib/Group').model;
var User = require('./model');
var client = require('lib/knox');

exports.hashPassword = function() {
  return function(user, next) {
    user.password = passwordHash.generate(user.password, config.hash);
    next();
  };
};

exports.emitJoinLeave = function() {
  return function(user, next) {
    var cur = _(user.groups).pluck('id').value();
    var prev = _(user.previous('groups'), 'toString').pluck('id').value();

    var joined = _.difference(cur, prev);
    var left = _.difference(prev, cur);

    if(joined.length) {
      Group.schema.dispatch('join', {user: user, groups: joined});
    }
    if(left.length) {
      Group.schema.dispatch('leave', {user: user, groups: left});
    }

    next && next();
  };
};

exports.createAvatar = function() {
  return function(user, next) {
    client.copyFile('/originals/default/default.png', '/' + user.id, {
      'x-amz-acl': 'public-read',
      'x-amz-metadata-directive': 'REPLACE',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': 0,
      'Content-Type': 'image/png'
    }, function(err) {
      if (err) {
        console.error('Error setting up avatar for user:' + user.id);
      }
    });
    next && next();
  };
};

exports.displayName = function() {
  return function(user, next) {
    if (!user.displayName) {
      user.displayName = [(user.name.honorificPrefix === 'None' || !user.name.honorificPrefix)
        ? user.name.givenName
        : user.name.honorificPrefix,
        user.name.familyName
      ].filter(Boolean).join(' ');
    }
    next();
  };
};


exports.emitProfile = function(adverb, type) {
  return function(user, next) {
    if (user.isNew)
      return next();
    User.schema.dispatch('profile', {
      adverb: adverb,
      type: type,
      user: user
    }, function(err) {
      if (next)
        next(err);
    });
  };
};

exports.lowercaseUsername = function() {
  return function(user, next) {
    user.username = user.username.toLowerCase();
    user.email = (user.email && user.email.toLowerCase());
    next();
  };
};