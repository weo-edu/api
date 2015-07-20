/**
 * Modules
 */

var express = require('express')

/**
 * Libs
 */

var actions = require('./actions')
var mw = require('./middleware')
var pageToken = require('lib/page-token')
var user = require('lib/User')

/**
 * Expose app
 */

var app = module.exports = express()

app.get('/shares',
  user.middleware.me({no404: true}),
  pageToken(),
  mw.contextPublic,
  mw.shareOptions({published: true}),
  actions.getShares
)

app.get('/boards',
  pageToken(),
  actions.getBoards
)

app.get('/people',
  pageToken(),
  actions.getPeople
)