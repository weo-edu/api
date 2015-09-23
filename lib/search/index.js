/**
 * Modules
 */

var express = require('express')

/**
 * Libs
 */

var actions = require('./actions')
var models = require('./model')
var mw = require('./middleware')
var pageToken = require('lib/page-token')
var user = require('lib/User')
var auth = require('lib/Auth')

var shares = models.shares({published: true, fork: false})
var myShares = models.shares({published: true, actor: true})

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
  , actions.get(shares))

app.get('/myShares'
  , auth.middleware.user
  , user.middleware.me()
  , pageToken()
  , mw.contextPublic
  , actions.get(myShares))

app.get('/boards'
  , pageToken()
  , actions.get(models.boards))

app.get('/people'
  , pageToken()
  , actions.get(models.people))

app.get('/counts'
  , user.middleware.me({no404: true})
  , actions.getCounts(shares, myShares, models.boards, models.people))
