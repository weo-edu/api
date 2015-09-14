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
        doc._object[0].attachments.forEach(function (att) {
          if (att.objectType === 'question' && att.response) {
            att.response = [].concat(att.response)
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
