var mongo = require('mongodb').MongoClient
var url = process.env.MONGO_URL

var scrape = require('lib/scrape')
var es = require('event-stream')
var _ = require('lodash')

var processed = 0
var enqueued = 0
var updated = 0
var stream

exports.up = function (cb){
  var map = {shares: 'Share', groups: 'Group', users: 'User'}

  mongo.connect(url, function (err, db) {
    if (err) throw err
    console.log('connected')

    db.collection('shares', function(err, shares) {
      if (err) throw err
      console.log('got collection')

      var cursor = shares
        .find({})
        .batchSize(10000)

      process()

      function process () {
        if (processed % 1000 === 0) console.log(`processed: ${processed}  updated: ${updated}`)

        cursor.nextObject(function (err, doc) {
          if (err) {
            console.log('error')
            throw err
          }

          if (!doc) {
            console.log('finished')
            return cb()
          }

          if (processed >= 688000) console.log(`processed: ${processed}  updated: ${updated}`, doc._id)

          if (doc._object && doc._object[0] && doc._object[0].attachments) {
            var found = false
            processed++

            Promise.all(doc._object[0].attachments.map(function (att) {
              if ((att.objectType === 'video' || att.objectType === 'document') && att.content.startsWith('<p>') && att.originalContent) {
                return new Promise(resolve => {
                  scrape(att.originalContent, function (err, data) {
                    if (!err) _.extend(att, data)
                    else {
                      console.log('error', att.originalContent, err)
                      att.content = att.content.replace(/^\<p\>/, '<p rescraped>')
                    }

                    found = true
                    resolve()
                  })
                })
              }

              return new Promise(resolve => resolve())
            }))
              .then(() => found && (new Promise(resolve => shares.save(doc, resolve))))
              .then(() => found && console.log(`processed: ${processed}  updated: ${++updated}`))
              .then(process)
          } else {
            processed++
            process()
          }
        })
      }
    })
  })
}

exports.down = function (next) {
  next()
}
