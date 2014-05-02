var Assignment = require('./model');
var Seq = require('seq');

exports.addStudent = function(user, next) {
  console.log('addStudent hook');
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