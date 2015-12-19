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
var auth = require('lib/Auth')

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
  , actions.queryActivities)

app.get('/myShares'
  , auth.middleware.user
  , user.middleware.me()
  , pageToken()
  , mw.contextPublic
  , actions.queryMyActivities)

app.get('/boards'
  , pageToken()
  , actions.queryBoards)

app.get('/people'
  , pageToken()
  , actions.queryPeople)

app.get('/counts'
  , user.middleware.me({no404: true})
  , actions.counts)
