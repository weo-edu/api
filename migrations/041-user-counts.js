var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');
var is = require('@weo-edu/is')
var mongo = require('../lib/mongo')


exports.up = function(next){
  chug.src('users', {})
    .pipe(es.map(function(doc, cb) {
      if (!doc.followers) doc.followers = 0
      if (!doc.following) doc.following = 0

      var Shares = mongo.collection('shares')
      var ObjectId = mongo.raw.bsonLib.ObjectID
      Shares.find({
        'contexts.descriptor.id': 'public',
        'actor.id': doc._id.toString()
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
