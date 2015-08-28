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

/**
 * Routes
 */

app.get('/shares'
  , pageToken()
  , mw.contextPublic
  , mw.shareOptions({published: true})
  , actions.getShares)

app.get('/myShares'
  , user.middleware.me()
  , pageToken()
  , mw.contextPublic
  , mw.shareOptions({published: true})
  , actions.getShares)

app.get('/boards'
  , pageToken()
  , actions.getBoards)

app.get('/people'
  , pageToken()
  , actions.getPeople)

app.get('/counts'
  , user.middleware.me({no404: true})
  , actions.getCounts)