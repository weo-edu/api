var chug = require('chug')(require('../lib/config/').mongo.url);
var es = require('event-stream');

exports.up = function(next){
  chug.src('shares', {})
    .pipe(es.through(function(doc) {
      if(doc._root)
        doc._root = [doc._root[0]];
      if(doc._parent)
        doc._parent = [doc._parent[0]];

      this.emit('data', doc);
    }))
    .pipe(chug.dest('shares'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
