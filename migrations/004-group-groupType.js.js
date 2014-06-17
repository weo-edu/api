var chug = require('chug')(require('../lib/config').mongo.url);
var _ = require('lodash');
var es = require('event-stream');

exports.up = function(next){
  chug.src('groups', {})
    .pipe(es.through(function(doc) {
      if(doc.groupType && doc.groupType.indexOf(':') !== -1) {
        var parts = doc.groupType.split(':');
        doc.groupType = parts[0];
        doc.status = parts[1].slice(0, -1);
      }

      this.emit('data', doc);
    }))
    .pipe(chug.dest('groups'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
