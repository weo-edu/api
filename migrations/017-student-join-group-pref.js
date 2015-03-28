var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');

exports.up = function(next){
  chug.src('users')
    .pipe(es.through(function(doc) {
      doc.preferences = doc.preferences || {};
      doc.preferences.group_joined = true;
      this.emit('data', doc);
    }))
    .pipe(chug.dest('users'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
