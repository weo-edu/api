var mongoose = require('mongoose');
var FormSchema = require('./schema')(mongoose.Schema);
var Seq = require('seq');
var _ = require('lodash');

FormSchema.method('verb', function() {
  return 'assigned';
});

var Form = module.exports = {schema: FormSchema};


Form.addStudent = function(groupId, userId, cb) {
  var update = {$set: {}};
  update.$set['payload.' + groupId + '.students.' + userId] = {progress: 0, score: 0, reward_claimed: false};
  var Share = mongoose.model('Share');
  Share.update({'to.board': groupId, '_object.attachments.objectType': {$in: ['poll']}}, update, {multi: true}, function(err, data) {
    cb(err, data);
  });
};

Form.score = function(shareId, groupId, studentId, score, cb) {
  var update = {};
  update['payload.' + groupId + '.students.' + studentId + '.progress'] = 1;
  update['payload.' + groupId + '.students.' + studentId + '.score'] = score;
  var Share = mongoose.model('Share');
  Share.update({_id: shareId}, update, function(err) {
    cb(err, {progress: 1, score: score});
  });
};








