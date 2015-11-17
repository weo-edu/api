var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');
var is = require('@weo-edu/is')
var mongo = require('../lib/mongo')


exports.up = function(next){
  chug.src('users', {})
    .pipe(es.map(function(doc, cb) {
      var Shares = mongo.collection('shares')
      var ObjectId = mongo.raw.bsonLib.ObjectID
      Shares.find({
        'contexts.descriptor.id': 'public',
        'actor.id': doc._id.toString(),
        shareType: 'share',
        '_object.objectType': 'section',
        channels: /.*\.board/
      }).count().then(function(count) {
        doc.pinCount = count
        cb(null, doc)
      }).catch(cb)

    }))
    .pipe(chug.dest('users'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
