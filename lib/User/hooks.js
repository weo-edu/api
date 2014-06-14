var passwordHash = require('password-hash');
var config = require('lib/config');
var _ = require('lodash');
var mongoose = require('mongoose');
var Group = require('lib/Group').model;
var client = require('lib/knox');

exports.hashPassword = function() {
  return function(user, next) {
    user.password = passwordHash.generate(user.password, config.hash);
    next();
  };
};

exports.emitJoinLeave = function() {
  return function(user) {
    var cur = _.invoke(user.populated('groups') || user.groups, 'toString');
    var prev = _.invoke(user.previous('groups'), 'toString');

    var joined = _.difference(cur, prev);
    var left = _.difference(prev, cur);

    if(joined.length)
      Group.schema.dispatch('join', {user: user, groups: joined});
    if(left.length)
      Group.schema.dispatch('leave', {user: user, groups: left});
  };
}

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
      user.displayName = (this.name.honorificPrefix === 'None' || !this.name.honorificPrefix)
        ? this.name.givenName
        : this.name.honorificPrefix,
        this.name.familyName
      ].filter(Boolean).join(' ');
    }
    next();
  }
};