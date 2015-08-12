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
var actions = require('./actions')

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

app.get('/following/:id'
  , user.middleware.me()
  , actions.isFollowing)

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

app.put('/:id/follow'
  , user.middleware.me()
  , actions.follow)

app.del('/:id/follow'
  , user.middleware.me()
  , actions.unfollow)

app.get('/:id/followers'
  , actions.followers)