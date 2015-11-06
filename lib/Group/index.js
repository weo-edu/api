var express = require('express')
var app = module.exports = express()

var Group = app.model = require('./model')
app.actions = require('./actions')
app.middleware = require('./middleware')


var auth = require('lib/Auth')
var user = require('lib/User')
var lookup = require('lib/lookup')
var lock = require('lib/lock')
var createTest = require('lib/class-boilerplate')
var notify = require('lib/notify')
var track = require('lib/analytics')

/**
 * Routes
 */
app.get('/lookup/:code'
  , app.middleware.lookupByCode({lean: true})
  , app.actions.lookup)

app.get('/students'
  , auth.middleware.isAuthenticated
  , app.actions.studentsInGroups)

app.get('/test'
  , auth.middleware.isAuthenticated
  , user.middleware.me()
  , user.middleware.is('teacher')
  , createTest.action)

app.put('/join/:code'
  , auth.middleware.isAuthenticated
  , user.middleware.me()
  , app.middleware.lookupByCode()
  , notify.joinedClass
  , app.actions.join)

app.post('/'
  , auth.middleware.isAuthenticated
  , user.middleware.me()
  , user.middleware.is('teacher')
  , track.middleware('Created Class', ['displayName'])
  , app.actions.create)

app.put('/:id'
  , auth.middleware.isAuthenticated
  , lookup(Group)
  , app.middleware.isOwner
  , app.actions.update)

app.post('/:id/invite'
  , auth.middleware.isAuthenticated
  , user.middleware.me()
  , lookup(Group)
  , app.middleware.isOwner
  , track.middleware('Invited Students')
  , app.actions.invite)

app.del('/:id'
  , auth.middleware.isAuthenticated
  , lookup(Group)
  , app.middleware.isOwner
  , app.actions.destroy)

app.put('/:id/members/:userId'
  , auth.middleware.isAuthenticated
  , user.middleware.me()
  , lock.middleware('userId')
  , lookup(user.model, {param: 'userId', key: '_id'})
  , lookup(Group)
  , app.actions.addUser)

app.del('/:id/members/:userId'
  , auth.middleware.isAuthenticated
  , lock.middleware('userId')
  , lookup(user.model, {param: 'userId', key: '_id'})
  , lookup(Group)
  , app.actions.removeUser)

app.put('/:id/archive'
  , auth.middleware.isAuthenticated
  , lookup(Group)
  , app.middleware.isOwner
  , app.actions.archive)

app.get('/:id'
  , lookup(Group, {lean: true})
  , app.actions.get)


/**
 * RouterIO app
 */
var io = app.io = require('lib/routerware')()
var ioActions = require('./io')

io.post('/students/subscription'
  , user.middleware.me()
  , app.middleware.belongsTo('group')
  , ioActions.subscribe)

io.del('/students/subscription'
  , user.middleware.me()
  , app.middleware.belongsTo('group')
  , ioActions.unsubscribe)

/**
 * Foreign references
 */
Group
  .ref('User', 'groups')
  .ref('Share', 'contexts.descriptor')
