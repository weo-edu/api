var mongo = require('../lib/mongo')
var es = require('event-stream')
var _ = require('lodash')

exports.up = function(cb){
  mongo.connect.then(function () {
    var groups = mongo.collection('groups')
    var users = mongo.collection('users')
    var ObjectId = mongo.raw.bsonLib.ObjectID

    users
      .find({})
      .pipe(es.map(function (user, cb) {
        var groupIds = user.groups.map(g => ObjectId(g.id))

        groups
          .find({_id: {$in: groupIds}})
          .then(groups => {
            var modified = false

            user.groups.forEach(g => {
              var group = _.find(groups, function (group) {
                return group._id.toString() === g.id
              })

              if (!group) {
                var ug = _.find(user.groups, {id: g.id})
                ug.status = 'archived'
                modified = true
              } else if (group.status !== g.status) {
                g.status = group.status
                modified = true
              }
            })

            if (modified) {
              return users
                .findOne(user._id)
                .update(user)
            }
          })
          .then(function () { cb() }, cb)
      }))
      .on('end', cb)
  })
}

exports.down = function(next){
  next()
}



