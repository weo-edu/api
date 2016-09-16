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
              console.log('enqueueing')
              return enqueue(function () {
                return new Promise(resolve => {
                  scrape(att.originalContent, function (err, data) {
                    if (!err) _.extend(att, data)
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


var limit = 10
var queue = []
var n = 0
var q = new Promise(resolve => resolve())

function enqueue (fn) {
  if (n > limit) {
    return new Promise(resolve => {
      return queue.push([fn, resolve])
    })
  }

  n++
  var res = q
    .then(fn, () => fn())

  q = res
    .then(() => {}, () => {})
    .then(() => {
      n--
      if (queue.length) {
        var item = queue.shift()
        console.log('here', n, queue.length)
        enqueue(item[0]).then(item[1], item[1])
      }
    })


  return res
}
