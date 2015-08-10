var request = require('superagent')
var cookie = require('cookie')
var connect

exports.get = function(property, cb) {
  var r = request
    .get('http://tempmail.weo.io')

  if (connect)
    r.set('cookie', cookie.serialize('connect.sid', connect['connect.sid']))

  r.end(function(err, res){
    if (res.headers['set-cookie'])
      connect = cookie.parse(res.headers['set-cookie'][0])
    cb && cb(err, res.body[property])
  })
}

exports.pollInbox = function(cb) {
  exports.get('items', function(err, items) {
    if (err) return cb(err)
    if (items.length)
      cb(null, items)
    else {
      setTimeout(function() {
        exports.pollInbox(cb)
      }, 1000)
    }
  })
}