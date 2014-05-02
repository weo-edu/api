var Req = require('./request');
var Res = require('./response');

module.exports = function(app) {
  return function(socket, next) {
    socket.on('route', function(data, cb) {
      var req = new Req(data, socket)
        , res = new Res(data, cb);

      app.handle(req, res, function(err) {
        if (err) {
          res.send(500, err);
        } else {
          res.send(404);
        }
      });

    });
    next();
  };
};