var mongoose = require('mongoose');
var AssignmentSchema = require('./schema')(mongoose.Schema);
var Seq = require('seq');
var _ = require('lodash');


AssignmentSchema.static('addStudent', function(groupId, userId, cb) {
  var update = {$set: {}};
  update.$set['payload.' + groupId + '.students.' + userId] = {progress: 0, score: 0, reward_claimed: false};
  this.find({'to.id': groupId}).exec(function(err, data) {
    console.log('err', err, data);
  })
  this.update({'to.id': groupId}, update, function(err, data) {
    console.log('err data', err, data);

    cb(err, data);
  });
});

AssignmentSchema.static('score', function(shareId, groupId, studentId, score, cb) {
  var update = {$set: {}};
  update.$set['payload.' + groupId + '.students.' + studentId + '.progress'] = 1;
  update.$set['payload.' + groupId + '.students.' + studentId + '.score'] = score;
  this.update({_id: shareId}, update, function(err) {
    cb(err, {progress: 1, score: score});
  });
});



var Share = require('lib/Share').model;
var Assignment = module.exports = Share.discriminator('assignment', AssignmentSchema);









