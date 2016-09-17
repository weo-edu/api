var mongo = require('../lib/mongo')
var scrape = require('lib/scrape')
var es = require('event-stream')
var _ = require('lodash')

var processed = 0
var enqueued = 0
var updated = 0

exports.up = function (cb){
  var map = {shares: 'Share', groups: 'Group', users: 'User'}

  mongo.connect.then(function () {
    var shares = mongo.collection('shares')

    shares
      .find()
      .pipe(es.map(function (doc, cb) {
        if (doc._object && doc._object[0] && doc._object[0].attachments) {
          var found = false
          processed++

          Promise.all(doc._object[0].attachments.map(function (att) {
            if ((att.objectType === 'video' || att.objectType === 'document') && att.content.startsWith('<p>') && att.originalContent) {
              enqueued++
              return enqueue(function () {
                return new Promise(resolve => {
                  scrape(att.originalContent, function (err, data) {
                    if (!err) _.extend(att, data)
                    else att.content = att.content.replace(/^\<p\>/, '<p rescraped>')

                    found = true
                    resolve()
                  })
                })
              })
            }

            return new Promise(resolve => resolve())
          }))
            .then(() => found && shares.findOne(doc._id).update(doc))
            .then(() => cb())
            .then(() => found && console.log(`processed: ${processed}  enqueued: ${enqueued}  updated: ${++updated}`))
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


var limit = 10
var queue = []
var n = 0

function enqueue (fn, front) {
  if (n > limit) {
    return new Promise(resolve => {
      return front
        ? queue.unshift([fn, resolve])
        : queue.push([fn, resolve])
    })
  }

  n++
  return fn()
    .then(() => {
      n--
      if (queue.length) {
        var item = queue.shift()
        enqueue(item[0], true).then(item[1], item[1])
      }
    }, err => console.log('err', err))
}
