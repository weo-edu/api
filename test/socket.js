var Seq = require('seq')
  , User = require('./helpers/user')
  , Cookie = require('cookie');

require('./helpers/boot');


function connectNewUser(opts, cb) {
  opts = opts || {};
  var user, token, cookie;
  Seq()
    .seq(function() {
      user = User.create(opts, this);
    })
    .seq(function() {
      User.login(user.username, user.password, this);
    })
    .seq(function(res) {
      token = res.body.token;
      var con = socketConnect(token)
      con.on('connect', function() {
        cb(null, con);
      })
    });
}

describe('socket', function() {
  it('should connect with valid token', function(done) {
    connectNewUser({}, function(con) {
      done();
    })
  });

  it('should fail to connect when unauthorized', function(done) {
    var socket = socketConnect('invalid');
    socket.on('error', function() {
      done();
    })
  });

});

