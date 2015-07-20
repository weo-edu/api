/**
 * Modules
 */

var express = require('express')


/**
 * Libs
 */

var Group = require('lib/Group')
var user = require('lib/User')


/**
 * Locals
 */

var middleware = require('./middleware')


/**
 * Expose app
 */

var app = module.exports = express()

app.post('/'
  , user.middleware.me()
  , user.middleware.is('teacher')
  , middleware.setGroupType
  , Group.actions.create
)

app.put('/:id'
  , middleware.lookUp
  , Group.middleware.isOwner
  , Group.actions.update
)

app.del('/:id'
  , middleware.lookUp
  , Group.middleware.isOwner
  , Group.actions.destroy
)