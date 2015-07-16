var actions = exports

actions.subscribe = function() {
  return function(req, res) {
    var id = req.param('id')
    id && req.socket.join(id)
    res.send(200)
  }
}

actions.unsubscribe = function() {
  return function(req, res) {
    var id = req.param('id')
    id && req.socket.leave(id)
    res.send(200)
  }
}