var passwordHash = require('password-hash');
var config = require('lib/config');
var _ = require('lodash');
var mongoose = require('mongoose');
var Group = require('lib/Group').model;
var knox = require('knox');
var client = knox.createClient({
  key: "AKIAIMDHEMBP5SULSA3A",
  secret: "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",
  bucket: 'avatar.eos.io',
  region: 'us-west-1'
});

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

exports.createAvatar = function(user, next) {
  client.copyFile('/originals/default/default.png', '/' + user.id, {'x-amz-acl': 'public-read'}, function(err) {
    if (err) {
      console.error('Error setting up avatar for user:' + user.id);
    }
  });
  next && next();
};