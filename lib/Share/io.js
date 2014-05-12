var access = require('lib/access');

var actions = exports;


// XXX if access levels change between subscribe and unsubscribe
// we are in trouble. maybe we should always leave all rooms

actions.subscribe = function(req, res, next) {
  var to = [].concat(req.param('to'));
  var parent = req.param('parent');
  var user = req.me;

  to.forEach(function(addressId) {
    user.fullAccess(addressId, parent).forEach(function(key) {
      req.socket.join(key);
    });
  });

  res.send();
};


actions.unsubscribe = function(req, res, next) {
  var to = [].concat(req.param('to'));
  var parent = req.param('parent');
  var user = req.me;

  to.forEach(function(addressId) {
    user.fullAccess(addressId, parent).forEach(function(key) {
      req.socket.leave(key);
    });
  });

  res.send();
};