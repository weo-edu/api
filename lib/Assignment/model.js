var mongoose = require('mongoose');
var AssignmentSchema = require('./schema')(mongoose.Schema);
var Seq = require('seq');
var _ = require('lodash');


AssignmentSchema.static('addStudent', function(groupId, userId, cb) {
  var update = {$set: {}};
  update.$set['payload.' + groupId + '.students.' + userId] = {progress: 0, score: 0, reward_claimed: false};
  this.update({'to.id': groupId}, update, {multi: true}, function(err, data) {
    cb(err, data);
  });
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