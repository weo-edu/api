var chug = require('chug')(require('../lib/config/').mongo.url);
var es = require('event-stream');
var qs = require('querystring');


exports.up = function(next){
  chug.src('shares', {shareType: 'shareInstance'})
    .pipe(es.through(function(doc) {
      if (!doc.annotations) {
        doc.annotations = {
          total: [],
          canonicalTotal: {
            items: 0
          },
          last: {},
          selfLink: '/share?' + qs.stringify({channel: 'share!' + doc._id + '.annotations'})
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
