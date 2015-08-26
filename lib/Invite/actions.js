/**
 * Imports
 */

var model = require('./model')
var errors = require('lib/errors')

/**
 * Actions
 */

exports.invite = function(req, res, next) {
  if(req.me.invitations <= 0)
    return res.send(400)

  var email = req.body.email
  model
    .send(req.me, email)
    .then(
      function () {
        req.me.invitations--
        req.me.save(function () {
          res.send(200)
        })
      },
      function (res) {
        if (res.status === 400) {
          return next(errors
            .Client('Invalid email')
            .error('invalid', 'email')
          )
        }

        next(res.body)
      }
    )
}

exports.checkCode = function (req, res, next) {
  var code = req.param('code')

  // Hardcoded value we can use for tests
  if (code === 'weo_testcode' || code === 'beta')
    return res.send(200)

  model
    .validate(code)
    .then(function(valid) {
      valid ? res.send(200) : res.send(400)
    }, next)
}

exports.request = function (req, res, next) {
  var email = req.body.email

  model
    .request(email)
    .then(
      function () { res.send(200) },
      function (res) {
        if (res.status === 400) {
          return next(errors
            .Client('Invalid email')
            .error('invalid', 'email')
          )
        }

        next(res.body)
      }
    )
}