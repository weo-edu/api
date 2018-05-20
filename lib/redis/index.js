var redis = require('redis')
var config = require('lib/config')
var url = require('url')
var querystring = require('querystring')
var _ = require('lodash')
  
var password, database
var parsed_url  = url.parse(config.redis || 'redis://localhost:6379')
var parsed_auth = (parsed_url.auth || '').split(':')
var database = parseInt(parsed_auth[0])
var password = parsed_auth[1]
var options = querystring.parse(parsed_url.query)

var client = module.exports = {
  create: function(opts) {
    opts = opts || {}
    console.log('Logging redis errors')
    var r = redis.createClient(parsed_url.port, parsed_url.hostname, _.extend(options, opts))
    if (password) {
      r.auth(password, function(err) {
        if (err) throw err
      })
    }

    if (! _.isNaN(database)) {
      r.select(database)
      r.on('connect', function() {
        r.send_anyways = true
        r.select(database)
        r.send_anyways = false
      });
    }
    
    r.on('error', function (err) {
      console.log('Redis Error:', err)
    })
    
    return r
  }
}

client.default = client.create()
client.pub = client.create({detect_buffers: true})
client.sub = client.create({detect_buffers: true})
