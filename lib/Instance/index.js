/**
 * Imports
 */

var express = require('express')
var actions = require('./actions')
var Share = require('lib/Share/model')
var notify = require('lib/notify')
var lookup = require('lib/lookup')
var lock = require('lib/lock')
var user = require('lib/User')

/**
 * Vars
 */

var app = express()

/**
 * Routes
 */

/**
 * Update instance
 */

app.put('/:id'
  , lock.middleware('id')
  , lookup(Share)
  , actions.update)

/**
 * Set score
 */

app.put('/:id/score/:itemId'
  , lock.middleware('id')
  , lookup(Share)
  , actions.score)

/**
 * Set response
 */

app.put('/:id/question/:questionId/response'
  , actions.answerQuestion)

/**
 * Set instance states
 */

app.put('/:id/opened'
  , lock.middleware('id')
  , lookup(Share)
  , actions.opened)

app.put('/:id/turned_in'
  , lock.middleware('id')
  , lookup(Share)
  , notify.turnedIn
  , user.middleware.me()
  , actions.autograde
  , actions.turnedIn)

app.put('/:id/graded'
  , lock.middleware('id')
  , lookup(Share)
  , user.middleware.me()
  , actions.autograde
  , actions.graded)

app.put('/:id/returned'
  , lock.middleware('id')
  , lookup(Share)
  , user.middleware.me()
  , notify.returned
  , actions.autograde
  , actions.returned)

/**
 * Exports
 */

module.exports = app
