var express = require('express')
var app = module.exports = express()

var User = app.model = require('./model')
app.actions = require('./actions')
app.middleware = require('./middleware')

var auth = require('lib/Auth')
var lookup = require('lib/lookup')
var share = require('lib/Share')
var pageToken = require('lib/page-token')
var notify = require('lib/notify')

require('lib/Group')
require('lib/S3')

// User Routes

app.get('/'
  , app.middleware.me({no404: true, lean: true})
  , app.actions.me)

app.post('/forgot'
  , app.middleware.byUsernameOrEmail
  , app.actions.forgot)

app.put('/reset'
  , app.middleware.checkResetToken
  , app.actions.editPassword)

app.del('/notifications'
  , app.middleware.me()
  , app.actions.clearNotifications)

app.get('/similar'
  , app.middleware.me()
  , pageToken()
  , app.actions.similar)

app.get('/following/:id'
  , app.middleware.me()
  , app.actions.isFollowing)

app.get('/:id/likes'
  , lookup(User)
  , pageToken()
  , share.actions.likes)

app.get('/:id/boards'
  , lookup(User)
  , app.actions.groups('board'))


/**
 * Following
 */

app.get('/:id/followers'
  , pageToken()
  , app.actions.followers)

app.get('/:id/following'
  , pageToken()
  , app.actions.following)

app.put('/:id/follow'
  , app.middleware.me()
  , lookup(User)
  , notify('followed_user')
  , app.actions.follow)

app.del('/:id/follow'
  , app.middleware.me()
  , app.actions.unfollow)

/**
 * Groups
 */

app.get('/groups'
  , auth.middleware.user
  , app.middleware.me()
  , app.actions.groups('class'))

app.get('/featured',
  app.actions.featured
)

app.get('/classes'
  , auth.middleware.user
  , app.middleware.me()
  , app.actions.groups('class'))

app.get('/boards'
  , auth.middleware.user
  , app.middleware.me()
  , app.actions.groups('board'))

app.get('/:id'
  , app.middleware.byUsernameOrId
  , app.actions.get)

// Authenticated routes
app.use(auth.middleware.isAuthenticated)

app.put('/'
  , app.middleware.me({property: 'user'})
  , app.actions.updateMe)

app.put('/:id/password'
  , lookup(User)
  , app.middleware.me()
  , app.middleware.canEditUser('password')
  , app.actions.editPassword)

app.put('/:id/username'
  , lookup(User)
  , app.middleware.me()
  , app.middleware.canEditUser('username')
  , app.actions.editField('username'))

app.put('/:id/email'
  , lookup(User)
  , app.middleware.me()
  , app.middleware.canEditUser('email')
  , app.actions.editField('email'))

app.put('/:id/sis'
  , lookup(User)
  , app.middleware.me()
  , app.middleware.canEditUser('sisId')
  , app.actions.editField('sisId'))

app.put('/:id/name'
  , lookup(User)
  , app.middleware.me()
  , app.middleware.canEditUser('name.givenName')
  , app.middleware.canEditUser('name.familyName')
  , app.middleware.canEditUser('name.honorificPrefix')
  , app.actions.editField('name'))



/**
 * Foreign references
 */
User
  .ref('Group', 'owners')
  .ref('Share', 'actor')

var io = app.io = require('lib/routerware')()
var ioActions = require('./io')

io.post('/subscription'
  , ioActions.subscribe())

io.del('/subscription'
  , ioActions.unsubscribe())
