var mongo = require('../lib/mongo')
var es = require('event-stream')
var _ = require('lodash')

exports.up = function(cb){
  mongo.connect.then(function () {
    var groups = mongo.collection('groups')
    var shares = mongo.collection('shares')
    var users = mongo.collection('users')
    var ObjectId = mongo.raw.bsonLib.ObjectID

    users
      .find({userType: 'teacher'})
      .pipe(es.map(function (user, cb) {
        shares
          .find({channels: `user!${user._id}.drafts'})`})
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



