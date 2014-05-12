var actions = exports;

// XXX if access levels change between subscribe and unsubscribe
// we are in trouble. maybe we should always leave all rooms

actions.subscribe = function(req, res, next) {
  // Allow scalar values
  var to = [].concat(req.param('to'));
  to.forEach(function(addressId) {
    req.socket.join(addressId);
  });

  res.send();
};


actions.unsubscribe = function(req, res, next) {
  // Allow scalar values
  var to = [].concat(req.param('to'));
  to.forEach(function(addressId) {
    req.socket.leave(addressId);
  });

  res.send();
};