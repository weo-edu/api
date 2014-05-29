var redis = require('lib/redis');
var auth = require('lib/Auth');
var adapter = require('socket.io-redis');
var routerio = require('lib/router.io');

var app = require('lib/routerware')();

app.use(function(req, res, next) {
  req.auth = req.socket.auth;
  next();
});

module.exports = {
  use: function(route, handler) {
    app.use(route, handler);
  },
  listen: function(server, opts) {
    opts = opts || {};
    io = require('socket.io').listen(server, opts);

    io.adapter(adapter({
      pubClient: redis.create({detect_buffers: true}),
      subClient: redis.create({detect_buffers: true}),
    }));

    io.use(function(socket, next) {
      socket.request.query = socket.request._query;
      next();
    });

    io.use(transform(auth.middleware.token));
    io.use(transform(auth.middleware.user));

    io.use(function(socket, next) {
      socket.auth = socket.request.auth;
      if (!socket.auth)
        return next(new Error('Not authorized'));
      next();
    });

    io.use(routerio(app));
    return io;
  },
  get sockets() {
    return io.sockets;
  }
}

function transform(fn) {
  return function(socket, next) {
    fn(socket.request, socket.request.res, next);
  };
}


