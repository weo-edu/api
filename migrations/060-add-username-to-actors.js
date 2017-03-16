var mongo = require('../lib/mongo')
var es = require('event-stream')
var _ = require('lodash')

exports.up = function (cb) {
  mongo.connect.then(function () {
    var shares = mongo.collection('shares')
    var users = mongo.collection('users')
    var ObjectId = mongo.raw.bsonLib.ObjectID

    shares
      .find({shareType: 'share'})
      .pipe(es.map(function (share, cb) {
        if (share.actor && !share.actor.username) {
          const id = share.actor.id

          users
            .findOne(share.actor.id)
            .then(
              user => {
                if (user) {
                  share.actor.username = user.username
                  shares
                    .findOne(share._id)
                    .update(share)
                    .then(function () { cb() }, cb)
                } else {
                  cb()
                }
              }
            )
        } else {
          cb()
        }
      }))
      .on('end', cb)
  })
}

exports.down = function (next) {
  next()
}
