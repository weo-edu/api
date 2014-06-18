var chug = require('chug')(require('../lib/config').mongo.url);
var _ = require('lodash');
var es = require('event-stream');

exports.up = function(next){
  chug.src('shares', {})
    .pipe(es.through(function(doc) {
      doc.contexts = doc.to;
      delete doc.to;
      doc.contexts.forEach(function(ctx) {
        ctx.id = ctx.board;
        delete ctx.board;
      });

      this.emit('data', doc);
    }))
    .pipe(chug.dest('shares'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
