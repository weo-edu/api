var chug = require('chug')(require('../lib/config/').mongo.url);
var es = require('event-stream');
var qs = require('querystring');
var async = require('async');

exports.up = function(next){
  var n = 0;
  chug.src('Share')
    .pipe(es.through(function(doc) {
      var attachments = doc._object[0].attachments;
      attachments && attachments.forEach(function(object) {
        if(object.objectType === 'formQuestion')
          object.objectType = 'question';
      });

      n++;
      console.log('items', n);
      this.emit('data', doc);
    }))
    .on('error', function(err) {
      console.log('error', err);
    })
    .pipe(chug.dest('Share'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
