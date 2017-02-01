var mongo = require('../lib/mongo')
var es = require('event-stream')
var _ = require('lodash')

exports.up = function (cb) {
  mongo.connect.then(function () {
    var shares = mongo.collection('shares')
    var ObjectId = mongo.raw.bsonLib.ObjectID

    shares
      .find({shareType: 'shareInstance'})
      .pipe(es.map(function (share, cb) {
        share.responses = share.responses || {}

        if (share._object) {
          let max = 0
          let points = 0

          share._object[0].attachments.forEach(att => {
            if (att.objectType === 'question') {
              const resp = share.responses[att._id] = share.responses[att._id] || {}
              resp.response = att.response
              resp.score = (att.points && att.points.scaled) || 0
              max += (att.points.max || 0)
              points += max * resp.score
            }
          })

          share.score = points / max
          delete share._object
        } else {
          shares
            .findOne({_id: ObjectId(share._parent[0].id)})
            .then(parent => {
              let max = 0
              if (!parent || !parent._object || !parent._object[0] || !parent._object[0].attachments) return cb()
              share.score = parent._object[0].attachments.reduce((score, att) => {
                if (share.responses[att._id]) {
                  const r = share.responses[att._id]
                  score += r.score * att.points.max
                  max += att.points.max
                }

                return score
              }, 0) / max

              shares
                .findOne(share._id)
                .update(share)
                .then(() => cb(), cb)
            })
            .then(null, cb)
          return
        }

        shares
          .findOne(share._id)
          .update(share)
          .then(function () { cb() }, cb)
      }))
      .on('end', cb)
  })
}

exports.down = function (next) {
  next()
}
