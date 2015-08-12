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
        var qs = (doc.groups || []).map(function(groupKey, idx) {
          return groups
            .findOne({_id: ObjectId(groupKey.id)})
            .then(function(group) {
              if(group)
                doc.groups[idx].groupType = group.groupType
            })
        })

        Promise
          .all(qs)
          .then(function() { cb(null, doc) }, cb)
      }))
      .pipe(chug.dest('users'))
      .on('end', next)
  })
}

exports.down = function(next){
  next()
}
