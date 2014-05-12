var Assignment = require('./model');
var Seq = require('seq');
var _ = require('lodash');

exports.addStudent = function(data, next) {
  var groups = data.groups;
  var user = data.user;
  Seq(groups)
    .parEach(function(group) {
      Assignment.addStudent(group, user.id, this);
    })
    .seq(function() {
      next();
    })
    ['catch'](function(err) {
      next(err);
    });
};