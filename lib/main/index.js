/**
 * Dependencies
 */
var express = require('express')


/**
 * Load Resources
 */

var auth = require('lib/Auth')
var s3 = require('lib/S3')
var user = require('lib/User')
var student = require('lib/Student')
var teacher = require('lib/Teacher')
var group = require('lib/Group')
var board = require('lib/Board')
var share = require('lib/Share')
var instance = require('lib/Instance')
var preference = require('lib/Preference')
var search = require('lib/search')
var avatar = require('lib/Avatar')
var invite = require('lib/Invite')
var khan = require('lib/khan')

require('lib/Question')
require('lib/Object')

var io = require('lib/io')

/**
 * Create app
 */
var app = module.exports = express()


/**
 * Pre-controller middleware
 */

// Convert lists to objects with list meta
app.use(require('lib/list-middleware'))
// Health check url
app.use(require('lib/health'))


/**
 * Controllers
 */

app.use(auth)
app.use('/s3', s3)
app.use('/user', user)
app.use('/student', student)
app.use('/teacher', teacher)
app.use('/group', group)
app.use('/board', board)
app.use('/share', share)
app.use('/instance', instance)
app.use('/preference', preference)
app.use('/search', search)
app.use('/avatar', avatar)
app.use('/invite', invite)
app.use('/khan/', khan)

/**
 * Router IO
 */

/**
 * Router IO Middleware
 */

io.use(require('lib/rio-tokens-middleware')())

/**
 * Router IO Mounts
 */

io.use('/share', share.io)
io.use('/group', group.io)
io.use('/user', user.io)

app.on('mount', function(app) {
  app.on('listen', function(app, server) {
    var sio = io.listen(server, {transports: ['websocket', 'polling']})
    sio.use(require('lib/sio-can-access')())
    sio.use(require('lib/sio-room-refcount')())
  })
})
