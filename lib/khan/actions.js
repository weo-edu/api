/**
 * Imports
 */

var khan = require('./model')

/**
 * Actions
 */

function requestToken (req, res, next) {
  khan
    .requestToken(req.param('redirect_uri'))
    .then(function (body) {
      res.send(body)
    }, next)
}

function saveOauthToken (req, res, next) {
  khan(
    req.body.oauth_token_secret,
    req.body.oauth_token,
    req.body.oauth_verifier
  ).then(function (body) {
      var auth = req.me.auth.khan

      auth.oauth_token = req.body.oauth_token
      auth.oauth_verifier = req.body.oauth_verifier
      auth.access_token = body.oauth_token
      auth.access_token_secret = body.oauth_token_secret

      return req.me.save()
    })
    .then(
      function () { res.send(200) },
      next
    )
}

function getExerciseInfo (req, res, next) {
  var name = req.param('name')

  khan
    .getExerciseInfo(name)
    .then(function (exercise) {
      res.send(exercise)
    })
    .then(null, next)
}

function getLog (req, res, next) {
  var name = req.param('name')
  var since = Number(req.param('since') || 0)

  khan
    .getExerciseLog(req.me, name)
    .then(function (exerciseLog) {
      console.log('exerciseLog', exerciseLog)
      return since
        ? exerciseLog
          .filter(function (item) {
            return (new Date (item.time_done)) > since
          })
        : exerciseLog
    })
    .then(function (exerciseLog) {
      res.send(exerciseLog)
    })
    .then(null, next)
}

function getExercise (req, res, next) {
  var name = req.param('name')

  khan
    .getUserExercise(req.me, name)
    .then(function (exercise) {
      res.send(exercise)
    }, next)
}

function checkState (req, res, next) {
  var name = req.param('name')
  var since = req.param('since')

  khan
    .checkExerciseState(req.me, name, since)
    .then(
      function (state) { res.send(state) },
      next
    )
}

/**
 * Exports
 */

module.exports = {
  requestToken: requestToken,
  saveOauthToken: saveOauthToken,
  checkState: checkState,
  getExerciseInfo: getExerciseInfo,
  getExercise: getExercise,
  getLog: getLog
}