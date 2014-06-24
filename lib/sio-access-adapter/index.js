var redisAdapter = require('socket.io-redis');
var Adapter = require('socket.io-redis/node_modules/socket.io-adapter');

module.exports = function(uri, opts) {
  var adapter = redisAdapter(uri, opts);

  Adapter.prototype.broadcast = function(packet, opts){
    var rooms = opts.rooms || [];
    var except = opts.except || [];
    var flags = opts.flags || {};
    var ids = {};
    var self = this;
    var socket;

    packet.nsp = this.nsp.name;
    this.encoder.encode(packet, function(encodedPackets) {
      if (rooms.length) {
        for (var i = 0; i < rooms.length; i++) {
          var room = self.rooms[rooms[i]];
          if (!room) continue;
          for (var id in room) {
            if (ids[id] || ~except.indexOf(id)) continue;
            socket = self.nsp.connected[id];
            if (socket && socket.canAccess(packet)) {
              socket.packet(encodedPackets, true, flags.volatile);
              ids[id] = true;
            }
          }
        }
      } else {
        for (var id in self.sids) {
          if (~except.indexOf(id)) continue;
          socket = self.nsp.connected[id];
          if (socket && socket.canAccess(packet))
            socket.packet(encodedPackets, true, flags.volatile);
        }
      }
    });
  };

  return adapter;
};