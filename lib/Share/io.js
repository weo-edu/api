var access = require('lib/access');

var actions = exports;


// XXX if access levels change between subscribe and unsubscribe
// we are in trouble. maybe we should always leave all rooms

actions.subscribe = function(req, res, next) {
  var boards = req.param('board');
  var channel = req.param('channel');
  var user = req.me;

  boards = [].concat(boards) // XXX why is this necessary
  _.each(boards, function(board) {
    _.each(user.fullAccess(board, channel), function(key) {
      req.socket.join(key);
    });
  });
  res.send();
};


actions.unsubscribe = function(req, res, next) {
  var boards = req.param('board');
  var channel = req.param('channel');
  var user = req.me;

  boards = [].concat(boards) // XXX why is this necessary
  _.each(boards, function(board) {
    _.each(user.fullAccess(board, channel), function(key) {
      req.socket.leave(key);
    });
  });
};