var actions = exports;

// XXX if access levels change between subscribe and unsubscribe
// we are in trouble. maybe we should always leave all rooms
actions.subscribe = joinLeaveFactory('join');
actions.unsubscribe = joinLeaveFactory('leave');

function joinLeaveFactory(method) {
  return function(req, res) {
    var channels = [].concat(req.param('channel'));

    channels.forEach(function(channel) {
      req.socket[method](channel);
    });

    res.send(200);
  };
}