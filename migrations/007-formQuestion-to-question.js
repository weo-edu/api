var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');
var qs = require('querystring');
var async = require('async');

exports.up = function(next){
  var n = 0;
  chug.src('shares')
    .pipe(es.through(function(doc) {
      if(doc._object && doc._object[0]) {
        var attachments = doc._object[0].attachments;
        attachments && attachments.forEach(function(object) {
          if(object.objectType === 'formQuestion')
            object.objectType = 'question';
        });

        n++;
      }

      this.emit('data', doc);
    }))
    .on('error', function(err) {
      console.log('error', err);
    })
    .pipe(chug.dest('shares'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
