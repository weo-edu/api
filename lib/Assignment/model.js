var mongoose = require('mongoose');
var AssignmentSchema = require('./schema')(mongoose.Schema);
var Seq = require('seq');
var _ = require('lodash');


AssignmentSchema.static('addStudent', function(groupId, userId, cb) {
  var update = {};
  update['payload.' + groupId + '.students.' + userId] = {progress: 0, score: 0, reward_claimed: false};
  this.update({'to.addresses.id': groupId}, update, cb);
});

AssignmentSchema.static('score', function(shareId, groupId, studentId, score, cb) {
  var update = {};
  update['payload.' + groupId + '.students.' + studentId + '.progress'] = 1;
  update['payload.' + groupId + '.students.' + studentId + '.score'] = score;
  this.update({_id: shareId}, update, function(err) {
    cb(err, {progress: 1, score: score});
  });
});



var Share = require('lib/Share').model;
var Assignment = module.exports = Share.discriminator('assignment', AssignmentSchema);

var UserSchema = require('lib/User').model.schema;
UserSchema.use('change:groups', function(user, next) {
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
});







