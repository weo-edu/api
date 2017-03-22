var mongo = require('../lib/mongo')
var es = require('event-stream')
var _ = require('lodash')

exports.up = function (cb) {
  mongo.connect.then(function () {
    var shares = mongo.collection('shares')
    var ObjectId = mongo.raw.bsonLib.ObjectID

    let i = 0
    let j = 0

    shares
      .find({shareType: 'share'})
      .pipe(es.map(function (share, cb) {
        i++
        shares
          .find({channels: `share!${share._id}.instances`})
          .then((insts = []) => Promise.all(insts.map(inst => {
            try {
              if (inst.score !== undefined) {
                const score = grade(share, inst)
                return shares
                  .findOne(inst._id)
                  .update({$set: {score: score}})
                  .then(() => shares
                    .findOne(share._id)
                    .update({
                      $set: {
                        [`instances.total.0.actors.${inst.actor.id}.pointsScaled`]: score
                      }
                    })
                  )
              }
            } catch (err) {
              console.log('err', err, share._id, inst._id)
              throw err
            }
          })))
          .then(() => cb(), cb)
      }))
      .on('end', cb)
  })
}

exports.down = function (next) {
  next()
}

function grade (share, inst) {
  const [points, max] = share._object[0].attachments
    .reduce((scores, att) => {
      if (!att.points || !att.points.max || att.poll) return scores

      const resps = inst.responses || {}
      const resp = resps[att._id] || {}

      return [
        scores[0] + (resp.score || 0) * (att.points.max || 0),
        scores[1] + (att.points.max || 0)
      ]
    }, [0, 0])

  return points / (max || 1)
}
