var access = require('lib/access');
var actions = exports;


// XXX if access levels change between subscribe and unsubscribe
// we are in trouble. maybe we should always leave all rooms

actions.subscribe = function(req, res, next) {
  var boards = req.param('board');
  var channel = req.param('channel');
  var user = req.me;

  [].concat(boards).forEach(function(board) {
    user.fullAccess(board, channel).forEach(function(key) {
      req.socket.join(key);
    });
  });

  res.send(200);
};


actions.unsubscribe = function(req, res, next) {
  var boards = req.param('board');
  var channel = req.param('channel');
  var user = req.me;

  [].concat(boards).forEach(function(board) {
    user.fullAccess(board, channel).forEach(function(key) {
      req.socket.leave(key);
    });
  });

  res.send(200);
};