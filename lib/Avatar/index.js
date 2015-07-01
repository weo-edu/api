/**
 * Modules
 */
var express = require('express')
var actions = require('./actions')
var model = require('./model')
var user = require('lib/User')
var auth = require('lib/Auth')

/**
 * Vars
 */
var app = express()

app.actions = actions
app.model = model

/**
 * Routes
 */
app.get('/:id'
  , actions.get)

app.put('/'
  , auth.middleware.isAuthenticated
  , user.middleware.me()
  , actions.set)

/**
 * Exports
 */
module.exports = app