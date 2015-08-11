module.exports = {
  connectUser: function (user) {
    return (new Promise(function(resolve) {
      var con = socketConnect(user.socketToken)
      con.on('message', function(msg) {
        user.messages.push(msg)
      })
      con.on('connect', function() {
        resolve(con)
      })
      user.con = con
      user.messages = []
    }))
  },
  subscribe: function (user, channel) {
    return (new Promise(function(resolve) {
      user.con.post('/share/subscription', {channel: channel}, function() {
        resolve()
      })
    }))
  }
}