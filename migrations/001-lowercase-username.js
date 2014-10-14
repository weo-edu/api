var chug = require('chug')(require('../lib/config/').mongo.url);
var es = require('event-stream');

exports.up = function(next){
  chug.src('users', {})
    .pipe(es.through(function(doc) {
      doc.username = doc.username.toLowerCase();
      this.emit('data', doc);
    }))
    .pipe(chug.dest('users'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
