var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');
var is = require('@weo-edu/is')

exports.up = function(next){
  chug.src('users', {})
    .pipe(es.through(function(doc) {
      if (doc.gradeLevels && !is.array(doc.gradeLevels)) {
        doc.gradeLevels = [doc.gradeLevels]
      }
      if (doc.subjects && !is.array(doc.subjects)) {
        doc.subjects = [doc.subjects]
      }
      this.emit('data', doc);
    }))
    .pipe(chug.dest('users'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
