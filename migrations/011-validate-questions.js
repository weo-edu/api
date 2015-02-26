var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');
var _ = require('lodash');

exports.up = function(next){

  function checkAttachments(parent) {
    var attachments = parent.attachments || [];
    var correct = [];
    attachments.forEach(function(attachment) {
      if (attachment.objectType === 'question' && !attachment.originalContent) {
        attachment.originalContent = attachment.displayName;
      }

      if (attachment.objectType === 'choice') {
        correct = correct.concat(attachment.correctAnswer || []);
      }

      // descend
      checkAttachments(attachment);

    });
    if (parent.objectType === 'question' && parent.poll === false && !correct.length && attachments.length &&  attachments[0].objectType === 'choice' ) {
      attachments[0].correctAnswer = [attachments[0]._id];
    }
  }

  chug.src('shares', {})
    .pipe(es.through(function(doc) {

      if (doc._object[0])
        checkAttachments(doc._object[0]);

      this.emit('data', doc);
    }))
    .pipe(chug.dest('shares'))
    .on('end', next);
};

exports.down = function(next){
  next();
};