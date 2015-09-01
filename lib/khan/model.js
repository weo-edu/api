/**
 * Imports
 */

var config = require('lib/config')
var schema = require('./schema')
var Khan = require('khan')
var User = require('lib/User/model')

/**
 * Vars
 */

var khan = Khan(
  config.khan.consumerKey,
  config.khan.consumerSecret
)

/**
 * Khan model
 */

function requestToken (redirectUri) {
  return khan.requestToken(redirectUri)
}

function accessToken (tokenSecret, oauthToken, oauthVerifier) {
  return khan(tokenSecret)
    .accessToken(oauthToken, oauthVerifier)
}

function getExerciseInfo (name) {
  return khan.exercise(name)
}

function getExerciseLog (user, name) {
  return userKhan(user)
    .userExerciseLog(name)
}

function getUserExercise (user, name) {
  return userKhan(user)
    .userExercise(name)
}

function checkExerciseState (user, name, since) {
  var authKhan = userKhan(user)
  return authKhan
    .userExercise(name)
    .then(function (userExercise) {
      return authKhan
        .userExerciseLog(name)
        .then(function (log) {
          return log
            .filter(doneSince(since))
            .reduce(function (memo, item) {
              memo.longest_streak = item.correct
                ? memo.longest_streak + 1
                : 0
             memo.completed++

              return memo
            }, {longest_streak: 0, completed: 0})
        })
        .then(hasCompleted(userExercise.exercise_model))
    })
}

function userKhan (user) {
  var auth = user.auth.khan
  return khan(auth.access_token_secret, auth.access_token)
}

/**
 * Model
 */

schema.method('autograde', function () {
  var obj = this
  var share = obj.share()

  return User
    .findById(obj.actor.id)
    .exec()
    .then(function (user) {
      if (!user.auth.khan) {
        return {done: false}
      }

      return checkExerciseState(user, obj.name, +share.at.opened)
    })
    .then(function (state) {
      obj.completed = state.done
      obj.points.scaled = +obj.completed
    })
})

/**
 * Helpers
 */

function doneSince (since) {
  return function (item) {
    return (new Date(item.time_done)) > since
  }
}

function hasCompleted (exercise) {
  return function (state) {
    var criteria = exercise.suggested_completion_criteria

    if (!(exercise.is_quiz || exercise.skill_check)) {
      var parts = /^num_correct_in_a_row_(\d+)$/.exec(criteria)

      state.required_streak = Number(parts[1])
      state.done = state.longest_streak >= state.required_streak
    } else {
      state.required_correct = exercise.all_assessment_items.length
      state.done = state.completed >= state.required_correct
    }

    return state
  }
}

/**
 * Exports
 */

module.exports = {
  accessToken: accessToken,
  requestToken: requestToken,
  getExerciseInfo: getExerciseInfo,
  getExerciseLog: getExerciseLog,
  getUserExercise: getUserExercise,
  checkExerciseState: checkExerciseState,
  schema: schema
}