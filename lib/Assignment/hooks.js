var Assignment = require('./model');
var Seq = require('seq');
var _ = require('lodash');

exports.addStudent = function(user, next) {
  var newGroups = _.difference(user.groups, user.previous('groups'));
  Seq(newGroups)
    .parEach(function(group) {
      Assignment.addStudent(group, user.id, this);
    })
    .seq(function() {
      next();
    })
    ['catch'](function(err) {
      next(err);
    })
};