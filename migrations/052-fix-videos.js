var mongo = require('../lib/mongo')
var scrape = require('lib/scrape')
var es = require('event-stream')
var _ = require('lodash')

exports.up = function (cb){
  var map = {shares: 'Share', groups: 'Group', users: 'User'}

  mongo.connect.then(function () {
    var shares = mongo.collection('shares')

    shares
      .find()
      .pipe(es.map(function (doc, cb) {
        var found = false

        if (doc._object && doc._object[0] && doc._object[0].attachments) {
          found = doc._object[0].attachments.forEach(function (att) {
            if ((att.objectType === 'video' || att.objectType === 'document') && att.content.startsWith('<p>')) {
              scrape(att.originalContent, function (err, data) {
                if (err) return cb(err)

                _.extend(att, data)
                cb(null, doc)
              })
              found = true
            }
          })
        }

        if (!found) cb(null, doc)
      }))
      .pipe(es.map(function (doc, cb) {
        shares.findOne(doc._id).update(doc).then(function () {
          cb()
        }, function (err) { cb(err) })
      }))
      .on('end', cb)
  })
}

exports.down = function (next) {
  next()
}
