var Req = require('./request');
var Res = require('./response');

module.exports = function(app) {
  return function(socket, next) {
    socket.on('route', function(data, cb) {
      console.log('route');
      var req = new Req(data, socket)
        , res = new Res(data, cb);


      req.paramAsArray = function(name) {
        return [].concat(req.param(name)).filter(Boolean);
      };

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