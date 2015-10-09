var app = module.exports = require('express')()

app.actions = require('./actions')
app.middleware = require('./middleware')

var user = require('lib/User')

/**
 * Middleware
 */
app.use(app.middleware.token)
app.use(app.middleware.user)
app.use(app.middleware.passport)

/**
 * Routes
 */
app.post('/auth/login'
  , user.middleware.byUsernameOrEmail
  , app.middleware.checkPassword
  , app.actions.login)

app.post('/auth/user'
  , app.actions.create)

app.post('/auth/google'
  , app.middleware.lookupByGoogle
  , app.middleware.googleCreateIfNew
  , app.actions.login)

app.post('/auth/clever'
  , app.middleware.lookupByClever
  , app.middleware.cleverCreateIfNew
  , app.actions.login)

app.post('/auth/facebook'
  , app.middleware.lookupByFacebook
  , app.middleware.facebookCreateIfNew
  , app.actions.login)

app.put('/auth/login/google'
  , app.middleware.lookupByGoogle
  , app.actions.login)

app.put('/auth/login/facebook'
  , app.middleware.lookupByFacebook
  , app.actions.login)

app.put('/auth/login/clever'
  , app.middleware.lookupByClever
  , app.middleware.cleverCreateIfNew
  , app.actions.login)

app.post('/auth/link/google'
  , user.middleware.me()
  , app.actions.linkGoogle)

app.get('/auth/unlink/google'
  , user.middleware.me()
  , app.actions.unlinkGoogle)

app.get('/auth/unlink/khan'
  , user.middleware.me()
  , app.actions.unlinkKhan)
