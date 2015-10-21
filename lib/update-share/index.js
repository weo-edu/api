/**
 * Libs
 */
var async = require('async')
var queue = require('lib/queue')

/**
 * Vars
 */

var updateInstanceQueue = queue('updateInstanceQueue')

/**
 * Expsoe update share
 */

module.exports = updateShare

function updateShare (share, cb) {
  share.save(function(err, share) {
    if (err) return cb(err)
    if(share.isSheet() && share.isPublished()) {
      updateInstanceQueue.push(function (cb) {
        updateInstances(share, cb)
      })
    }
    cb(null, share)
  })
}


function updateInstances (share, cb) {
  share.findInstances().exec(function (err, instances) {
    if(err) return cb(err)

    var tree = share.object.toJSON()
    async.each(instances, function (inst, cb) {
      var data = inst.instanceData()
      var instProps = share.instanceProperties({context: inst.contextIds})
      inst.set(instProps)

      inst.object = tree
      inst.applyInstanceData(data)
      if (inst.hasTurnedIn()) {
        inst.object.grade()
      }

      inst.__rootUpdate = true
      inst.save(cb)
    }, cb)
  })
}
