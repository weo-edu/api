/**
 * Imports
 */

var pageToken = require('lib/page-token')
const validate = require('lib/validate')
const actions = require('./actions')
const express = require('express')
const schema = require('./schema')
const user = require('lib/User')

/**
 * Constants
 */

const app = express()

/**
 * Routes
 */

app.post('/'
  , validate(schema)
  , user.middleware.me()
  , actions.create)

app.get('/list/:id'
  , user.middleware.me()
  , actions.list)

app.get('/:id'
  , actions.get)

/**
 * Sockets
 */

var io = app.io = require('lib/routerware')()
var ioActions = require('./io')

io.post('/subscription'
  , ioActions.subscribe)

io.del('/subscription'
  , ioActions.unsubscribe)

/**
 * Exports
 */

module.exports = app
module.exports.model = require('./model')
