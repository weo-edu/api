exports.broadcast = function(io, evt) {
  return function(response) {
    socket.to(response.collection).send({verb: evt, data: response.toJSON()});
  }
}