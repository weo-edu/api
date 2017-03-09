var mongoose = require('mongoose')
var config = require('lib/config')
var debug = require('debug')('weo:db')

require('./plugins')()

debug('starting mongoose...')

mongoose
  .connect(config.mongo, {bufferMaxEntries: -1, keepAlive: 120})

mongoose
  .connection
  .on('error', function (err) {
    console.log('mongoose connection err', err)
  })

