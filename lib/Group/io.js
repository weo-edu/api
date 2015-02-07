var asArray = require('lib/as-array');

// XXX if access levels change between subscribe and unsubscribe
// we are in trouble. maybe we should always leave all rooms

exports.subscribe = joinLeaveFactory('join');
exports.unsubscribe = joinLeaveFactory('leave');

function joinLeaveFactory(method) {
  return function(req, res) {
    var channels = asArray(req.param('group'));
    channels.forEach(function(channel) {
      req.socket[method](channel);
    });

    res.send(200);
  };
}