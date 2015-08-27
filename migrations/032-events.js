var chug = require('mongo-chug')(require('../lib/config/').mongo)
var mongo = require('../lib/mongo')
var es = require('event-stream')

exports.up = function(next){
  mongo.connect.then(function() {
    var Shares = mongo.collection('shares')
    var ObjectId = mongo.raw.bsonLib.ObjectID

    chug
      .src('shares', {})
      .pipe(es.map(function(doc, cb) {
        if (!doc._object || !doc._object[0] || doc._object[0].objectType !== 'status')
          return cb(null, doc)
        // Only non-notifications
        if (doc.shareType === 'notification')
          return cb(null, doc)

        doc._object[0].actor = doc.actor
        doc._object[0].object = doc._parent[0]
        doc.shareType = 'notification'

        Shares
          .findOne({_id: ObjectId(doc._parent[0].id)})
          .then(function (share) {
            if (share) {
              if (doc._object[0].status === 'liked') {
                doc._object[0].meta = share.likersCount
              } else if (doc._object[0].status === 'pinned') {
                doc._object[0].meta = share.contexts[1] && share.contexts[1].descriptor
              }
            }

            cb(null, doc)
          }, cb)

      }))
      .pipe(chug.dest('shares'))
      .on('end', next)
  })
}

exports.down = function(next){
  next()
}