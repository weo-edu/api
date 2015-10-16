var chug = require('mongo-chug')(require('../lib/config/').mongo)
var mongo = require('../lib/mongo')
var es = require('event-stream')

exports.up = function(next){
  mongo.connect.then(function() {
    var shares = mongo.collection('shares')
    var ObjectId = mongo.raw.bsonLib.ObjectID

    chug.src('shares', {})
      .pipe(es.map(function(doc, cb) {
        if (isSheet(doc) && doc.fork) {
          shares
            .findOne({_id: ObjectId(doc._forked[0].id)})
            .then(function(share) {
              if (share && !doc._forked[0].board) {
                doc._forked[0].board = board(share)
                if (doc._forked[0].board) {
                  doc.pinnedFrom = {
                    board: doc._forked[0].board,
                    actor: doc._forked[0].actor
                  }
                } else {
                  doc.pinnedFrom = share.pinnedFrom
                }
              }
              cb(null, doc)
            }, cb)
        } else {
          cb(null, doc)
        }
      }))
      .on('error', function(err) {
        console.log('err', err )
      })
      .pipe(chug.dest('shares', 1))
      .on('end', next)
      .on('error', function(err) {
        console.log('err', err )
      })
  })
}

exports.down = function(next){
  next()
}

function isSheet(doc) {
  return doc.shareType === 'share' && doc._object && doc._object.length && doc._object[0].objectType === 'section';
}

function board (doc) {
  var context = doc.contexts[1]
  return context && context.descriptor.id !== 'me' && context.descriptor
}
