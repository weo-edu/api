var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');

exports.up = function(next){
  chug.src('shares', {shareType: 'notification'})
    .pipe(es.through(function(doc) {
      if (doc._object && doc._object.length) {
        if (doc._object[0].status === 'returned' || doc._object[0].status === 'annotated') {
          doc.channels = doc.channels.filter(function(channel) {
            return channel.indexOf('.notification') >= 0
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
