
var express = require('express')

var app = module.exports = express()

app.actions = require('./actions')
app.middleware = require('./middleware')

var auth = require('lib/Auth')
var user = require('lib/User')
var lock = require('lib/lock')

// global middleware
app.use(auth.middleware.isAuthenticated)

// routes

app.get('/?:name'
  , user.middleware.me()
  , app.actions.get)

app.put('/:name'
  , lock.middleware(function (req) {return req.auth.id})
  , user.middleware.me()
  , app.actions.set)
