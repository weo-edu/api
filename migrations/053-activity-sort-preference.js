var mongo = require('../lib/mongo')
var es = require('event-stream')

exports.up = function(cb){
  mongo.connect.then(function () {
    var users = mongo.collection('users')

    users
      .find()
      .pipe(es.through(function (doc) {
        if (doc.preferences && doc.preferences.shareStudentSort) {
          doc.preferences.shareStudentSort = {
            dir: 1,
            property: 'name.givenName'
          }
        }

        this.emit('data', doc)
      }))
      .pipe(es.map(function (doc, cb) {
        users.findOne(doc._id).update(doc).then(function () {
          cb()
        }, function (err) { cb(err) })
      }))
      .on('end', cb)
  })
}

exports.down = function(next){
  next()
}
