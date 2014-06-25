module.exports = function() {
  return function(socket, next) {
    var refs = {};

    var join = socket.join;
    socket.join = function(room, fn) {
      refs[room] = refs[room] || 0;
      refs[room]++;
      return join.apply(this, arguments);
    };

    var leave = socket.leave;
    socket.leave = function(room, fn) {
      refs[room] = refs[room] || 0;
      // Don't go below 0
      refs[room] = Math.max(refs[room]--, 0);

      if(refs[room] > 0) {
        fn && fn(null);
        return;
      }

      return leave.apply(this, arguments);
    };

    next();
  };
};