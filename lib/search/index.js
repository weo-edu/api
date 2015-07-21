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

/**
 * Expose app
 */

var app = module.exports = express()

app.get('/shares',
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