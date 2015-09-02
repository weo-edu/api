var chug = require('mongo-chug')(require('../lib/config/').mongo)
var es = require('event-stream')
var qs = require('querystring')
var _ = require('lodash')
var async = require('async')

exports.up = function(cb){
  var map = {shares: 'Share', groups: 'Group', users: 'User'}

  chug
    .src('shares')
    .pipe(es.through(function (doc) {
      if (doc._object && doc._object[0] && doc._object[0].attachments) {
        doc._object[0].attachments = doc._object[0].attachments.map(function (att) {
          if (att && att.attachments) {
            att.attachments = att.attachments.map(function (sub) {
              if (sub.objectType === 'choice') {
                return _.extend(sub, {originalContent: sub.displayName, content: sub.displayName})
              }

              return sub
            })
          }

          return att
        })
      }

      this.emit('data', _.extend(doc, {_object: doc._object.slice(0)}))
    }))
    .pipe(chug.dest('shares'))
    .on('end', cb)
}

exports.down = function(next){
  next()
}
