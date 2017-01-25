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

app.get('/lookup'
  , actions.lookup)

app.post('/'
  , validate(schema)
  , user.middleware.me()
  , actions.create)

app.put('/:id/name'
  , validate(schema.name)
  , actions.setProp('name'))

app.put('/:id/join'
  , user.middleware.me()
  , actions.joinSchool)

app.put('/:id/logo'
  , actions.setProp('logo'))

app.put('/:id/location'
  , actions.setProp('location'))

app.put('/:id/color'
  , actions.setProp('color'))

app.get('/'
  , user.middleware.me()
  , actions.mySchool)

app.get('/:id'
  , actions.get)

app.get('/:id/teachers'
  , pageToken()
  , actions.getTeachers)

app.get('/:id/students'
  , pageToken()
  , actions.getStudents)

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
