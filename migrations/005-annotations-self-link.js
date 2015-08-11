var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');
var qs = require('querystring');


exports.up = function(next){
  chug.src('shares')
    .pipe(es.through(function(doc) {
      if (doc.shareType === 'shareInstance' && !doc.annotations) {
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
    .on('end', next)
    .on('error', function(err) {
      console.log('err');
    })
};

exports.down = function(next){
  next();
};
