/**
 * Imports
 */

var model = require('./model')

/**
 * Actions
 */

exports.invite = function(req, res, next) {
  if(req.me.invitations <= 0)
    return res.send(400)

  var email = req.body.email

  req.me.invitations--
  req.me.save(function() {
    model
      .send(req.me, email)
      .then(function() { res.send(200) }, next)
  })
}

exports.checkCode = function (req, res, next) {
  var code = req.param('code')

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
      function() { res.send(200) },
      next
    )
}