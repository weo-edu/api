/**
 * Imports
 */

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
  , actions.create)

app.post('/:id/name'
  , validate(schema.name)
  , actions.setProp('name'))

app.post('/:id/avatar'
  , actions.setProp('avatar'))

app.post('/:id/location'
  , actions.setProp('location'))

app.post('/:id/color'
  , actions.setProp('color'))

app.get('/:id'
  , actions.get)

app.get('/:id/teachers'
  , actions.getTeachers)

app.get('/:id/students'
  , actions.getStudents)

app.get('/lookup'
  , actions.lookup)

/**
 * Exports
 */

module.exports = app
