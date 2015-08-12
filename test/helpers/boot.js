var path = require('path')
var app = require(path.join(process.cwd(), 'server.js'))
var supertest = require('supertest-promised')
var socket = require('socket.io-client')
var querystring = require('querystring')
var config = require('lib/config')
var routerIO = require('lib/router.io-client')(true)

// Use a different port for API tests, so that api tests
// can be run without killing any other servers that might
// be running
process.env.PORT = 1339

global.request = supertest(app)
global.socketConnect = function(token) {
  var qs = querystring.stringify({access_token: token})
  var url = 'http://localhost:' + config.port + '?' + qs
  var s = socket.connect(url, {forceNew: true})
  return routerIO(s)
}