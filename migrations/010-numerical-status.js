var chug = require('mongo-chug')(require('../lib/config/').mongo.url);
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

  chug.src('shares', {})
    .pipe(es.through(function(doc) {
      if(doc.shareType === 'shareInstance' && 'string' === typeof doc.status) {
        doc.status = map[doc.status];
      } else if (doc.shareType === 'share' && doc._object && doc._object.length && doc._object[0].objectType === 'section')  {
        
        if (doc.instances && doc.instances.canonicalTotal) {
          var newVal = map[doc.instances.canonicalTotal.status];
          if (!_.isUndefined(newVal))
            doc.instances.canonicalTotal.status = newVal;
          else
            delete doc.instances.canonicalTotal.satus;
        }

        if (doc.status === 'draft') {
          doc.publishedAt = doc.createdAt;
          if (doc.displayName) {
            doc.channels = ['user!' + doc.actor.id + '.drafts'];
          } else {
            doc.channels = [];
          }
          
        }
        delete doc.status;
      } else {
        delete doc.status;
      }


      this.emit('data', doc);
    }))
    .pipe(chug.dest('shares'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
