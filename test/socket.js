var Seq = require('seq')
var User = require('./helpers/user')
var Cookie = require('cookie')

require('./helpers/boot')


function connectNewUser(opts, cb) {
  opts = opts || {}
  var user, token, cookie
  Seq()
    .seq(function() {
      user = User.create(opts, this)
    })
    .seq(function() {
      User.login(user.username, user.password, this)
    })
    .seq(function(res) {
      token = res.body.token
      var con = socketConnect(token)
      con.on('connect', function() {
        cb(null, con)
      })
    })
}

describe('socket', function() {
  it('should connect with valid token', function(done) {
    connectNewUser({}, function(con) {
      done()
    })
  })
})

