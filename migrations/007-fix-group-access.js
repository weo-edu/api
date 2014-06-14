var chug = require('chug')(require('../lib/config').mongo.url);
var _ = require('lodash');
var es = require('event-stream');
var access = require('../lib/access');

exports.up = function(next){
  chug.src('groups', {})
    .pipe(es.through(function(doc) {
      doc.access.allow = [
        access.entry('public', 'teacher'),
        access.entry('group', 'student', doc._id)
      ];

      this.emit('data', doc);
    }))
    .pipe(chug.dest('groups'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
