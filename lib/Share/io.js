var asArray = require('as-array')

// XXX if access levels change between subscribe and unsubscribe
// we are in trouble. maybe we should always leave all rooms
exports.subscribe = joinLeaveFactory('join')
exports.unsubscribe = joinLeaveFactory('leave')

function joinLeaveFactory(method) {
  return function(req, res) {
    var channels = asArray(req.param('channel'))

    channels.forEach(function(channel) {
      req.socket[method](channel)
    })

    var id = req.param('id')
    if(id) {
      req.socket[method](id)
    }

    res.send(200)
  }
}