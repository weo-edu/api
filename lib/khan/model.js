/**
 * Imports
 */

var config = require('lib/config')
var schema = require('./schema')
var Khan = require('khan')
var User = require('lib/User/model')
var _ = require('lodash')

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

function accessToken (oauthToken, oauthVerifier, tokenSecret) {
  return khan.accessToken(oauthToken, oauthVerifier, tokenSecret)
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
      if (!userExercise) return {}

      console.log('userExercise', userExercise)
      return authKhan
        .userExerciseLog(name)
        .then(function (log) {
          var prunedLog = pruneLog(log || [], since)
          console.log('prunedLog', prunedLog)
          return prunedLog
            .reduce(function (memo, item) {
              memo.streak = item.correct ? memo.streak + 1 : 0
              memo.longest_streak = Math.max(memo.longest_streak, memo.streak)
              memo.correct += +item.correct
              memo.completed++
              return memo
            }, {longest_streak: 0, completed: 0, streak: 0, correct: 0})
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

schema.method('updateKhan', function (user) {
  var self = this
  return checkExerciseState(user, this.name, +this.share().at.opened)
    .then(function (state) {
      self.completed = state.done
      self.longestStreak = state.longest_streak
      self.requiredStreak = state.required_streak
      self.requiredCorrect = state.required_correct
      return self
    })
})

schema.method('autograde', function () {
  var obj = this

  return User
    .findById(obj.actor.id)
    .exec()
    .then(function (user) {
      if (!user.auth.khan) {
        return {done: false}
      }

      return obj.update(user)
    })
    .then(function () {
      obj.points.scaled = +obj.completed
    })
})

/**
 * Helpers
 */

function pruneLog (log, since) {
  var idx = _.sortedIndex(log, {time_done: +since}, function (item) {
    return +(new Date(item.time_done))
  })

  if (idx < log.length - 1) {
    while (idx > 0 && log[idx].correct) {
      idx--
    }
  }

  return log.slice(idx)
}

function hasCompleted (exercise) {
  return function (state) {
    if (!(exercise.is_quiz || exercise.skill_check)) {
      var criteria = exercise.suggested_completion_criteria
      var parts = /^num_correct_in_a_row_(\d+)$/.exec(criteria)

      state.required_streak = Number(parts[1])
      state.done = state.longest_streak >= state.required_streak
    } else {
      state.required_correct = exercise.all_assessment_items.length
      state.done = state.correct >= state.required_correct
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
