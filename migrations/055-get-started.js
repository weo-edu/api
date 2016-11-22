var mongo = require('../lib/mongo')
var es = require('event-stream')
var _ = require('lodash')

exports.up = function(cb){
  mongo.connect.then(function () {
    var users = mongo.collection('users')

    users
      .find({})
      .pipe(es.map(function (user, cb) {
        user.preferences = user.preferences || {}
        user.preferences.group_joined = true

        user.preferences.onboard = user.preferences.onboard || {}
        user.preferences.onboard.add_students = true
        user.preferences.onboard.create_share = true
        user.preferences.onboard.assign_share = true
        user.preferences.onboard.profile_set = true
        user.preferences.onboard.follow = true

        users
          .findOne(user._id)
          .update(user)
          .then(function () { cb() }, cb)
      }))
      .on('end', cb)
  })
}

exports.down = function(next){
  next()
}



