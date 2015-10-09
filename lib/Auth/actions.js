/**
 * Imports
 */

var mongoose = require('mongoose')
var Google = require('lib/google')
var errors = require('lib/errors')
var construct = require('lib/construct')
var jwt = require('lib/jwt')

/**
 * Actions
 */

function login (req, res, next) {
  if(! req.user) {
    return next(errors.NotFound('User not found', 'username'))
  }

  var token = jwt.sign({
    id: req.user.id,
    userType: req.user.userType
  })

  var user = req.user.toJSON()
  user.token = token
  res.json(user)
}

function create (req, res, next) {
  // Make sure we don't have empty string
  // for an email (i.e. if '' === req.body.email, we'd rather
  // have no email field at all)
  if (!req.body.email) {
    delete req.body.email
  }

  var User = mongoose.model('User')
  var user = construct(User, req.body)

  user.save(function (err, user) {
    if(err) return next(err)

    req.user = user

    res.status(201)
    login(req, res, next)
  })
}

function unlinkKhan (req, res, next) {
  if (req.me.hasKhan()) {
    req.me.auth.khan.oauth_token = null
    req.me.auth.khan.oauth_token_secret = null
    req.me.auth.khan.oauth_verifier = null
    req.me.auth.khan.access_token = null
    req.me.auth.khan.access_token_secret = null
  }

  req.me.save(function (err) {
    if(err) return next(err)
    res.status(200).end()
  })
}

function linkGoogle (req, res, next) {
  if(! req.me) {
    return next(errors.NotFound('User not found'))
  }

  var code = req.body.code
  var redirectUri = req.body.redirectUri
  Google.exchangeCodeForTokens({code: code, redirectUri: redirectUri}, function (err, tokens) {
    if(err) return next(err)

    req.me.auth.google.access_token = tokens.access_token
    req.me.auth.google.refresh_token = tokens.refresh_token

    req.me.save(function (err) {
      if(err) return next(err)
      res.status(200).end()
    })
  })
}

function unlinkGoogle (req, res, next) {
  if (req.me.hasGoogle()) {
    req.me.auth.google.access_token = null
    req.me.auth.google.refresh_token = null
  }

  req.me.save(function (err) {
    if(err) return next(err)
    res.status(200).end()
  })
}


/**
 * Exports
 */

module.exports = {
  login: login,
  create: create,
  unlinkKhan: unlinkKhan,
  linkGoogle: linkGoogle,
  unlinkGoogle: unlinkGoogle
}
