var chug = require('chug')(require('../lib/config/').mongo.url);
var es = require('event-stream');
var qs = require('querystring');
var async = require('async');

exports.up = function(next){
  chug.src('Share')
    .pipe(es.through(function(doc) {
      var attachments = doc._object[0];
      attachments.forEach(function(object) {
        if(object.objectType === 'formQuestion')
          object.objectType = 'question';
      });

      this.emit('data', doc);
    }))
    .pipe(chug.dest('Share'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
