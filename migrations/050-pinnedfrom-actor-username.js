var chug = require('mongo-chug')(require('../lib/config/').mongo)
var mongo = require('../lib/mongo')
var es = require('event-stream')

exports.up = function(cb){
  mongo.connect.then(function() {
    var Users = mongo.collection('users')
    var ObjectId = mongo.raw.bsonLib.ObjectID

    chug
      .src('shares', {})
      .pipe(es.map(function (doc, cb) {
        if (!doc.pinnedFrom || !doc.pinnedFrom.actor || doc.pinnedFrom.actor.username) {
          return cb(null, doc)
        }

        Users
          .findOne({_id: ObjectId(doc.pinnedFrom.actor.id)})
          .then(function (user) {
            if (!user) return cb(null, doc)
            doc.pinnedFrom.actor.username = user.username
            cb(null, doc)
          }, cb)
      }))
      .pipe(chug.dest('shares'))
      .on('end', cb)
  }, function (err) {
    console.log('connect err', err)
    cb(err)
  })
}

exports.down = function(next){
  next()
}
