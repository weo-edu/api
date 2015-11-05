var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');

exports.up = function(next){
  chug.src('shares', {})
    .pipe(es.through(function(doc) {
      if (isSheet(doc)) {
        var forked = doc._forked && doc._forked[0]
        var forkedSource = doc._forkedSource && doc._forkedSource[0]
        var notFork = (forked && forkedSource) &&
          forked.id === forkedSource.id &&
          !forked.board
        if (doc.fork && notFork) {
          doc.fork = false
        }
      }
      this.emit('data', doc);
    }))
    .pipe(chug.dest('shares'))
    .on('end', next);
};

exports.down = function(next){
  next();
};

function isSheet(doc) {
  return doc.shareType === 'share' && doc._object && doc._object.length && doc._object[0].objectType === 'section';
}
