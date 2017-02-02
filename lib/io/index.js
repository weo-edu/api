/**
 * Imports
 */

const adapter = require('socket.io-redis')
const routerio = require('lib/router.io')
const app = require('lib/routerware')()
const redis = require('lib/redis')
let io

/**
 * IO
 */

app.use(function (req, res, next) {
  req.auth = req.socket.auth
  next()
})

module.exports = {
  use: function (route, handler) {
    app.use(route, handler)
  },
  listen: function (server, opts) {
    opts = opts || {}

    io = require('socket.io').listen(server, opts)

    io.adapter(adapter({
      pubClient: redis.pub,
      subClient: redis.sub
    }))

    io.use(function (socket, next) {
      socket.request.query = socket.request._query
      next()
    })

    var auth = require('lib/Auth')
    io.use(transform(auth.middleware.token))
    io.use(transform(auth.middleware.user))

    io.use(function(socket, next) {
      socket.auth = socket.request.auth
      next()
    })

    io.use(routerio(app))

    return io
  },
  get sockets () {
    return io && io.sockets
  }
}

function transform (fn) {
  return function (socket, next) {
    fn(socket.request, socket.request.res, next)
  }
}
