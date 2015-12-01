var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');

exports.up = function(next){
  chug.src('shares', {shareType: 'share'})
    .pipe(es.through(function(doc) {
      if (isSheet(doc)) {
        if (doc.channels && doc.channels.length === 1 && doc.channels[0].indexOf('.trash') >= 0) {
          doc.contexts = doc.contexts.filter(function (context) {
            return context.descriptor.id !== 'public'
          })
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
