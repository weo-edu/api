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
app.actions = actions

/**
 * Routes
 */

app.post('/'
  , user.middleware.me()
  , actions.invite)

app.post('/request'
  , actions.request)

app.get('/:code'
  , actions.checkCode)

/**
 * Exports
 */

module.exports = app
