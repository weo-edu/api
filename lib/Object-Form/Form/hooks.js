var Form = require('./model');
var Seq = require('seq');
var _ = require('lodash');

exports.addStudent = function(data, next) {
  var groups = data.groups;
  var user = data.user;
  Seq(groups)
    .parEach(function(group) {
      Form.addStudent(group, user.id, this);
    })
    .seq(function() {
      next();
    })
    ['catch'](function(err) {
      next(err);
    });
};