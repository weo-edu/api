var access = require('lib/access');
var actions = exports;


// XXX if access levels change between subscribe and unsubscribe
// we are in trouble. maybe we should always leave all rooms

actions.subscribe = function(req, res, next) {
  var contexts = req.param('context');
  var channel = req.param('channel');
  var user = req.me;

  [].concat(contexts).forEach(function(context) {
    user.fullAccess(context, channel).forEach(function(key) {
      req.socket.join(key);
    });
  });

  res.send(200);
};


actions.unsubscribe = function(req, res, next) {
  var contexts = req.param('context');
  var channel = req.param('channel');
  var user = req.me;

  [].concat(contexts).forEach(function(context) {
    user.fullAccess(context, channel).forEach(function(key) {
      req.socket.leave(key);
    });
  });

  res.send(200);
};