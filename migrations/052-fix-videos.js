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
        if (doc._object && doc._object[0] && doc._object[0].attachments) {
          var found = false
          Promise.all(doc._object[0].attachments.map(function (att) {
            if ((att.objectType === 'video' || att.objectType === 'document') && att.content.startsWith('<p>') && att.originalContent) {
              return new Promise(resolve => {
                scrape(att.originalContent, function (err, data) {
                  if (!err) _.extend(att, data)
                  found = true
                  resolve()
                })
              })
            }

            return new Promise(resolve => resolve())
          }))
            .then(() => found && shares.findOne(doc._id).update(doc))
            .then(() => cb())
            .then(() => found && console.log('updated', doc._id))
        } else {
          cb(null, doc)
        }
      }))
      .on('end', cb)
  })
}

exports.down = function (next) {
  next()
}
