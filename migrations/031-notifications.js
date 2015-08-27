var chug = require('mongo-chug')(require('../lib/config/').mongo)
var mongo = require('../lib/mongo')
var es = require('event-stream')

exports.up = function(next){
  mongo.connect.then(function() {
    var Shares = mongo.collection('shares')
    var ObjectId = mongo.raw.bsonLib.ObjectID

    chug
      .src('shares', {shareType: 'notification'})
      .pipe(es.map(function(doc, cb) {
        // Only old-style notifications
        if (!doc._object[0].hasOwnProperty('instance'))
          return done()

        doc._object[0].actor = doc.actor
        doc._object[0].object = doc._parent[0]

        Shares
          .findOne({_id: ObjectId(doc._parent[0].id)})
          .then(function (share) {
            if (share) {
              if (doc._object[0].status === 'liked') {
                doc._object[0].meta = share.likersCount
              } else if (doc._object[0].status === 'pinned' && share.contexts && share.contexts[1]) {
                doc._object[0].meta = share.contexts[1] && share.contexts[1].descriptor
              }
            }

            delete doc._object[0].instance
            done()
          }, done)

        function done (err) {
          if (err) console.log('ERRROR', err)
          setTimeout(function () {
            cb(err || null, doc)
          })
        }
      }))
      .pipe(chug.dest('shares'))
      .on('end', next)
  })
}

exports.down = function(next){
  next()
}