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

// Unauthenticated route
app.get('/lookup/:code'
  , app.middleware.lookupByCode({lean: true})
  , app.actions.lookup)

app.get('/:id'
  , lookup(Group, {lean: true})
  , app.actions.get)


// Everything below this point requires authentication
app.use(auth.middleware.isAuthenticated)

// routes
app.get('/test'
  , user.middleware.me()
  , user.middleware.is('teacher')
  , createTest.action)

app.put('/join/:code'
  , user.middleware.me()
  , app.middleware.lookupByCode()
  , app.actions.join)

app.post('/'
  , user.middleware.me()
  , user.middleware.is('teacher')
  , app.actions.create)

app.get('/students'
  , app.actions.studentsInGroups)

app.put('/:id'
  , lookup(Group)
  , app.middleware.isOwner
  , app.actions.update)

app.del('/:id'
  , lookup(Group)
  , app.middleware.isOwner
  , app.actions.destroy)

app.put('/:id/members/:userId'
  , auth.middleware.isAuthenticated
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