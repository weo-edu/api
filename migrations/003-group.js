var chug = require('chug')(require('../lib/config').mongo.url);
var _ = require('lodash');
var es = require('event-stream');
var access = require('../lib/access');

exports.up = function(next){
  chug.src('groups', {})
    .pipe(es.through(function(doc) {
      if(! doc.status)
        doc.status = 'active';
      this.emit('data', doc);
    }))
    .pipe(es.through(function(doc) {
      if(! doc.access || ! doc.access.allow.length) {
        doc.access = {};
        doc.access.allow = [
          access.entry('public', 'teacher'),
          access.entry('group', 'student', doc.id)
        ];
      }

      this.emit('data', doc);
    }))
    .pipe(chug.dest('groups'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
