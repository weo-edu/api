var chug = require('mongo-chug')(require('../lib/config/').mongo)
var es = require('event-stream')
var qs = require('querystring')
var async = require('async')

exports.up = function(cb){
  var map = {shares: 'Share', groups: 'Group', users: 'User'}

  chug
    .src('shares')
    .pipe(es.through(function (doc) {
      if (doc._object && doc._object[0] && doc._object[0].attachments) {
        doc._object[0].attachments.forEach(function (att) {
          if (att && att.attachments) {
            att.attachments.forEach(function (sub) {
              if (sub.objectType === 'choice') {
                sub.content = sub.originalContent = sub.displayName
                delete sub.displayName
              }
            })
          }
        })
      }

      this.emit('data', doc)
    }))
    .pipe(chug.dest('shares'))
    .on('end', cb)
}

exports.down = function(next){
  next()
}
