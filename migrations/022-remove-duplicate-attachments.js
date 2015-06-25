var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');
var _ = require('lodash')

exports.up = function(next){
  chug.src('shares', {})
    .pipe(es.through(function(doc) {
      if (isSheet(doc)) {
        doc._object[0].attachments = _.uniq(doc._object[0].attachments, function(v) {
          return v._id.toString()
        })
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
