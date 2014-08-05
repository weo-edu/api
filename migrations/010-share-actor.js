var chug = require('chug')(require('../lib/config').mongo.url);
var es = require('event-stream');

exports.up = function(next){
  chug.src('shares', {})
    .pipe(es.through(function(doc) {
      doc._actor = [doc.actor];
      delete doc.actor;
      this.emit('data', doc);
    }))
    .pipe(chug.dest('shares'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
