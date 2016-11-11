var mongo = require('../lib/mongo')
var es = require('event-stream')

exports.up = function(cb){
  mongo.connect.then(function () {
    var groups = mongo.collection('groups')
    var users = mongo.collection('users')

    groups
      .find({status: 'archived'})
      .pipe(es.map(function (group, cb) {
        console.log('group', group._id)
        var id = group._id.toString()

        users
          .find({'groups.id': id})
          .pipe(es.map(function (user, cb) {
            console.log('user', user._id)
            user.groups.forEach(function (group) {
              if (group.id === id) {
                console.log('setting status', group._id)
                group.status = 'archived'
              }
            })

            users
              .findOne(user._id)
              .update(user)
              .then(function () { cb() }, cb)
          }))
          .on('end', function () { cb() })
      }))
      .on('end', cb)
  })
}

exports.down = function(next){
  next()
}



