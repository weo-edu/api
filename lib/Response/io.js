actions.subscribe = function(req, res) {
  req.socket.join(req.param('collection'));
};

actions.unsubscribe = function(req, res) {
  req.socket.leave(req.param('collection'));
}