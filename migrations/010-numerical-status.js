var chug = require('chug')(require('../lib/config/').mongo.url);
var es = require('event-stream');
var status = require('lib/Share/status');
var _ = require('lodash');

exports.up = function(next){
  var map = {
    unstarted: status.unopened,
    pending: status.opened,
    active: status.turnedIn,
    returned: status.returned
  };

  chug.src('shares')
    .pipe(es.through(function(doc) {
      if(doc.shareType === 'shareInstance' && 'string' === typeof doc.status) {
        doc.status = map[doc.status];
      }

      this.emit('data', doc);
    }))
    .pipe(chug.dest('shares'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
