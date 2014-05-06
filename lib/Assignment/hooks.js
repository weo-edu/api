var Assignment = require('./model');
var Seq = require('seq');
var _ = require('lodash');

exports.addStudent = function(user, next) {
  var newGroups = _.difference(user.groups, user.previous('groups'));
  console.log('diff', newGroups);
  Seq(newGroups)
    .parEach(function(group) {
      console.log('addStudent', group);
      Assignment.addStudent(group, user.id, this);
    })
    .seq(function() {
      next();
    })
    ['catch'](function(err) {
      next(err);
    })
};