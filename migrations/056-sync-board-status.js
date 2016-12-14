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
        var activeBoards = user.groups
          .filter(g => g.groupType === 'board' && g.status === 'active')

        groups
          .find({_id: {$in: activeBoards.map(b => ObjectId(b.id))}})
          .then(boards => {
            activeBoards.forEach(b => {
              var board = _.find(boards, board => board._id.toString() === b.id)

              if (!board) {
                var ub = _.find(activeBoards, {id: b.id})
                ub.status = 'archived'
              } else if (board.status !== b.status) {
                b.status = board.status
              }
            })

            // Have to refilter because things may have changed
            var channels = user.groups
              .filter(g => g.groupType === 'board' && g.status === 'active')
              .map(g => `group!${g.id}.board`)

            return shares
              .find({shareType: 'share', channels: {$in: channels}})
              .count()
              .then(pinCount => {
                user.pinCount = pinCount

                return users
                  .findOne(user._id)
                  .update(user)
              })
          })
          .then(function () { cb() }, cb)
      }))
      .on('end', cb)
  })
}

exports.down = function(next){
  next()
}



