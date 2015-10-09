/**
 * Imports
 */

var express = require('express')
var Group = require('lib/Group')
var user = require('lib/User')
var middleware = require('./middleware')
var lookup = require('lib/lookup')
var actions = require('./actions')
var notify = require('lib/notify')
var pageToken = require('lib/page-token')

/**
 * Vars
 */

var app = express()

/**
 * Routes
 */

app.post('/'
  , user.middleware.me()
  , user.middleware.is('teacher')
  , middleware.setGroupType
  , Group.actions.create)

app.get('/following/:id'
  , user.middleware.me()
  , actions.isFollowing)

app.put('/:id'
  , lookup(Group.model)
  , Group.middleware.isOwner
  , Group.actions.update)

app.del('/:id'
  , lookup(Group.model)
  , Group.middleware.isOwner
  , Group.actions.destroy)

app.put('/:id/follow'
  , user.middleware.me()
  , lookup(Group.model)
  , notify('followed_board')
  , actions.follow)

app.del('/:id/follow'
  , user.middleware.me()
  , actions.unfollow)

app.get('/:id/followers'
  , pageToken()
  , actions.followers)

/**
 * Exports
 */

module.exports = app
