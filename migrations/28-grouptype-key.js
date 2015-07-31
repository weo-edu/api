var chug = require('mongo-chug')(require('../lib/config/').mongo)
var es = require('event-stream')
var mongo = require('../lib/mongo')

exports.up = function(next){
  mongo.connect.then(function() {
    var groups = mongo.collection('group')

    chug.src('users', {})
      .pipe(es.map(function(doc, cb) {
        var qs = (doc.groups || []).map(function(groupKey) {
          return groups
            .findOne({_id: groupKey.id})
            .then(function(group) {
              if(group)
                groupKey.groupType = group.groupType
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
