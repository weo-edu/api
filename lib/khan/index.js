/**
 * Imports
 */

var express = require('express')
var user = require('lib/User')
var actions = require('./actions')
var model = require('./model')

/**
 * Vars
 */

var app = express()

app.model = model

/**
 * Routes
 */

app.get('/request_token'
  , actions.requestToken)

app.post('/oauth_token'
  , user.middleware.me()
  , actions.saveOauthToken)

app.get('/exercise/:name/info'
  , actions.getExerciseInfo)

app.get('/exercise/:name/log'
  , user.middleware.me()
  , actions.getLog)

app.get('/exercise/:name/state'
  , user.middleware.me()
  , actions.checkState)

app.get('/exercise/:name'
  , user.middleware.me()
  , actions.getExercise)

app.put('/start/:instanceId/:objectId'
  , user.middleware.me()
  , actions.start)

app.put('/start/:instanceId/:objectId'
  , user.middleware.me()
  , actions.start)

app.put('/update/:instanceId/:objectId'
  , user.middleware.me()
  , actions.updateObject)

/**
 * Exports
 */

module.exports = app
