var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');

exports.up = function(next){
  chug.src('shares', {shareType: 'notification'})
    .pipe(es.through(function(doc) {
      var object = doc._object[0]
      var objectUrl = object.object.url
      if (isClassLink(objectUrl)) {
        object.object.url = objectUrl.slice(objectUrl.indexOf('/class/'))
      }
      var metaUrl = object.meta && object.meta.url
      if (object.meta && metaUrl&& isClassLink(metaUrl)) {
        object.meta.url = metaUrl.slice(metaUrl.indexOf('/class/'))
      }
      this.emit('data', doc);
    }))
    .pipe(chug.dest('shares'))
    .on('end', next);
};

exports.down = function(next){
  next();
};

function isClassLink(url) {
  return url.indexOf('/class/') >= 0
}
