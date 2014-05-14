var passwordHash = require('password-hash');
var config = require('lib/config');
var _ = require('lodash');
var mongoose = require('mongoose');
var Group = require('lib/Group').model;

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
};