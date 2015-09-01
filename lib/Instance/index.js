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
  , lookup(Share)
  , actions.update)

/**
 * Set score
 */

app.put('/:id/score/:itemId'
  , lookup(Share)
  , actions.score)

/**
 * Set response
 */

app.put('/:id/question/:questionId/response'
  , lock.middleware('id')
  , lookup(Share)
  , user.middleware.me()
  , actions.answerQuestion)

/**
 * Set instance states
 */

app.put('/:id/opened'
  , lookup(Share)
  , actions.opened)

app.put('/:id/turned_in'
  , lookup(Share)
  , notify('turned in')
  , actions.autograde
  , actions.turnedIn)

app.put('/:id/graded'
  , lookup(Share)
  , actions.autograde
  , actions.graded)

app.put('/:id/returned'
  , lookup(Share)
  , actions.autograde
  , actions.returned)

/**
 * Exports
 */

module.exports = app