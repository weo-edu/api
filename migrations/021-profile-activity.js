var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');
var _ = require('lodash');


exports.up = function(next){
  chug.src('shares', {})
    .pipe(es.through(function(doc) {
      if (isPublishedActivity(doc)) {
        doc.published = false
      }
      this.emit('data', doc);
    }))
    .pipe(chug.dest('shares'))
    .on('end', next);
};

exports.down = function(next){
  next();
};

function isPublishedActivity(doc) {
  return doc.published && doc.shareType === 'share' && doc._object && doc._object.length && doc._object[0].objectType === 'profile';
}
