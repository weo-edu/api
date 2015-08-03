/**
 * Imports
 */
var express = require('express')
var model = require('./model')

/**
 * Vars
 */
var app = express()
var mongo = require('lib/mongo')
// var hashid = require('lib/hashid')
var invites

app.model = model
mongo.connect.then(function() {
  invites = mongo.collection('invites')
})

/**
 * Routes
 */
app.post('/'
  , user.middleware.me()
  , function(req, res, next) {
      if(req.me.invitations <= 0)
        return res.send(400)

      req.me.invitations--
      req.me.save(function() {
        model
          .send(user.toKey, req.body.email)
          .then(function() { res.send(200) }, next)
      })
    })

app.get('/:code'
  , function(req, res) {
    model
      .validate(req.body.code)
      .then(
        function(valid) { valid ? res.send(200) : res.send(400) },
        next
      )
  })
