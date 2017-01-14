var mongo = require('../lib/mongo')
var es = require('event-stream')
var _ = require('lodash')

exports.up = function(cb){
  mongo.connect.then(function () {
    var shares = mongo.collection('shares')
    var users = mongo.collection('users')
    var ObjectId = mongo.raw.bsonLib.ObjectID

    users
      .find({userType: 'teacher'})
      .pipe(es.map(function (user, cb) {
        const channels = `user!${user._id}.drafts`

        shares
          .find({channels})
          .count()
          .then(count => {
            user.drafts.canonicalTotal.items = count

            return users
              .findOne(user._id)
              .update(user)
          }, cb)
          .then(() => cb(), cb)
      }))
      .on('end', cb)
  })
}

exports.down = function(next){
  next()
}



