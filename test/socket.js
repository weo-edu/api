var Seq = require('seq')
  , User = require('./helpers/user')
  , Cookie = require('cookie');

require('./helpers/boot');


function connectNewUser(opts, cb) {
  opts = opts || {};
  var user, token, cookie;
  Seq()
    .seq(function() {
      console.log('user create')
      user = User.create(opts, this);
    })
    .seq(function() {
      console.log('user login')
      User.login(user.username, user.password, this);
    })
    .seq(function(res) {
      token = res.body.token;
      console.log('socket connect');
      var con = socketConnect(token)
      con.on('connect', function() {
        cb(null, con);
      })
    });
}

describe('socket', function() {
  it.only('should connect with valid token', function(done) {
    console.log('connect new user');
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

