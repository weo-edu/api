/**
 * Imports
 */

var khan = require('./model')
var errors = require('lib/errors')
var ShareInstance = require('lib/Share/model').ShareInstance

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
  khan
    .accessToken(
      req.body.oauth_token,
      req.body.oauth_verifier,
      req.body.oauth_token_secret
    )
    .then(function (body) {
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

function start (req, res, next) {
  var instanceId = req.param('instanceId')
  var objectId = req.param('objectId')

  ShareInstance
    .findById(instanceId)
    .exec()
    .then(function (inst) {
      var object = inst.object.find(objectId)
      if (!object) {
        return next(errors.Server('Object not found in instance'))
      }

      return object
        .startKhan(req.me)

    })
}

function updateObject (req, res, next) {
  var instanceId = req.param('instanceId')
  var objectId = req.param('objectId')

  ShareInstance
    .findById(instanceId)
    .exec()
    .then(function (inst) {
      var object = inst.object.find(objectId)
      if (!object) {
        return next(errors.Server('Object not found in instance'))
      }

      return object
        .updateKhan(req.me)
        .then(function () {
          return inst.save()
        })
        .then(function () {
          res.send(200)
        })
    })
    .then(null, next)
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
  getLog: getLog,
  updateObject: updateObject,
  start: start
}