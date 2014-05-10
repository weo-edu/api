var access = require('lib/access');

var actions = exports;


// XXX if access levels change between subscribe and unsubscribe
// we are in trouble. maybe we should always leave all rooms

actions.subscribe = function(req, res, next) {
  var to = req.param('to');
  var channel = req.param('channel');
  var user = req.me;

  to = [].concat(to);
  _.each(to, function(addressId) {
    _.each(user.fullAccess(addressId, channel), function(key) {
      req.socket.join(key);
    });
  });
  res.send();
};


actions.unsubscribe = function(req, res, next) {
  var to = req.param('to');
  var channel = req.param('channel');
  var user = req.me;

  to = [].concat(to);
  _.each(to, function(addressId) {
    _.each(user.fullAccess(addressId, channel), function(key) {
      req.socket.leave(key);
    });
  });
};