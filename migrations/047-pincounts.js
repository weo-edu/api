var chug = require('mongo-chug')(require('../lib/config/').mongo)
var es = require('event-stream')
var mongo = require('../lib/mongo')

require('es6-promise').polyfill()

exports.up = function(next){
  mongo.connect.then(function() {
    var groups = mongo.collection('groups')
    var ObjectId = mongo.raw.bsonLib.ObjectID

    chug.src('users', {})
      .pipe(es.map(function(doc, cb) {
        var pinCount = 0
        var qs = (doc.groups || [])
          .filter(function (group) {
            return group.groupType === 'board' && group.status !== 'archived'
          })
          .map(function(groupKey, idx) {
            return groups
              .findOne({_id: ObjectId(groupKey.id)})
              .then(function(group) {
                pinCount += group.board.canonicalTotal.items
              })
          })

        Promise
          .all(qs)
          .then(function() {
            doc.pinCount = pinCount
            cb(null, doc)
          }, cb)
      }))
      .pipe(chug.dest('users'))
      .on('end', next)
  })
}

exports.down = function(next){
  next()
}
