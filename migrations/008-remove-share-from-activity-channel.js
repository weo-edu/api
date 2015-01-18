var chug = require('chug')(require('../lib/config').mongo.url);
var es = require('event-stream');
var qs = require('querystring');
var _ = require('lodash');



exports.up = function(next){
  chug.src('shares')
    .pipe(es.through(function(doc) {
      if (doc.shareType === 'shareInstance' || 
        (doc._object[0].objectType === 'section' && doc.shareType === 'share')) {
        doc.channels = doc.channels.filter(function(channel) {
          return channel.indexOf('activities') === -1;
        });
      }
      this.emit('data', doc);
    }))
    .on('error', function(err) {

    })
    .pipe(chug.dest('shares'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
