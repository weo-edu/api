var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');

exports.up = function(next){
  chug.src('shares', {})
    .pipe(es.through(function(doc) {
      function isDraft() {
        var channel = doc.channels[0];
        return doc.channels.length === 0
          || (doc.channels.length === 1 &&
            doc.channels[0].indexOf('drafts') !== -1);
      }

      doc.published = ! isDraft();
      this.emit('data', doc);
    }))
    .pipe(chug.dest('shares'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
