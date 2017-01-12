/**
 * Imports
 */

const express = require('express')
const user = require('lib/User')
const middleware = require('./middleware')
const actions = require('./actions')

/**
 * Constants
 */

const app = express()

/**
 * Routes
 */

app.post('/'
  , actions.create)

app.get('/:id',
  , actions.get)

app.get('/:id/teachers'
  , actions.getTeachers)

app.get('/:id/students',
  , actions.getStudents)

/**
 * Exports
 */

module.exports = app
