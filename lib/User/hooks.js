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
  return function(user, next) {
    var cur = user.populated('groups') || user.groups;
    var joined = _.difference(cur, user.previous('groups'));
    var left = _.difference(user.previous('groups'), cur);
    next = _.after(2, next);

    if(joined.length)
      Group.schema.dispatch('join', {user: user, groups: joined}, next);
    else
      next();

    if(left.length)
      Group.schema.dispatch('leave', {user: user, groups: left}, next);
    else
      next();
  };
};