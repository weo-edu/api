var actions = exports;

// XXX if access levels change between subscribe and unsubscribe
// we are in trouble. maybe we should always leave all rooms
actions.subscribe = joinLeaveFactory('join');
actions.unsubscribe = joinLeaveFactory('leave');

function joinLeaveFactory(method) {
  return function(req, res) {
    var channels = [].concat(req.param('channel')).filter(Boolean);

    channels.forEach(function(channel) {
      req.socket[method](channel);
    });

    var id = req.param('id');
    if(id) {
      req.socket[method](id);
    }

    res.send(200);
  };
}