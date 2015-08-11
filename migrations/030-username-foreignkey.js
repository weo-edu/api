var chug = require('mongo-chug')(require('../lib/config/').mongo)
var mongo = require('../lib/mongo')
var es = require('event-stream')

exports.up = function(next){
  mongo.connect.then(function() {
    var users = mongo.collection('users')
    var ObjectId = mongo.raw.bsonLib.ObjectID

    chug
      .src('groups', {})
      .pipe(es.map(function(doc, cb) {
        var owner = doc.owners[0]
        users
          .findOne({_id: ObjectId(owner.id)})
          .then(function(user) {
            if(user) {
              doc.owners[0].username = user.username
            }
            cb(null, doc)
          }, cb)
      }))
      .pipe(chug.dest('groups'))
      .on('end', next)
  })
}

exports.down = function(next){
  next()
}
