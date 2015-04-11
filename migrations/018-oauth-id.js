var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');

exports.up = function(next){
  chug.src('users', {})
    .pipe(es.through(function(doc) {
      if(doc.auth && doc.auth.google && 'string' === typeof doc.auth.google)
        doc.auth.google = {id: doc.auth.google};

      this.emit('data', doc);
    }))
    .pipe(chug.dest('users'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
