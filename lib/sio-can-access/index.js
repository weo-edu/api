module.exports = function() {
  return function(socket, next) {
    socket.canAccess = function(packet) {
      if(packet.data[0] === 'message') {
        var data = packet.data[1];
        if(data.tokens) {
          return data.tokens.some(function(token) {
            return socket.tokens[token];
          });
        }
      }
      return true;
    };

    next();
  };
};