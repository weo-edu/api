/**
 * Imports
 */

var config = require('lib/config')
var schema = require('./schema')
var Khan = require('khan')
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
      var criteria = completionCriteria(userExercise.exercise_model, since)

      return authKhan
        .userExerciseLog(name)
        .then(function (log) {
          var prunedLog = pruneLog(log || [], criteria)

          return prunedLog
            .reduce(function (memo, item) {
              memo.streak = item.correct ? memo.streak + 1 : 0
              memo.longest_streak = Math.max(memo.longest_streak, memo.streak)
              memo.correct += +item.correct
              memo.completed++
              return memo
            }, {
              longest_streak: 0,
              completed: 0,
              streak: 0,
              correct: 0,
              practiced_date: new Date(userExercise.practiced_date)
            })
        })
        .then(hasCompleted(criteria))
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
      self.done = state.done
      self.criteria = state.criteria
      self.required = state.required
      self.progress = state.progress
      return self
    })
})

schema.method('autograde', function () {
  this.points.scaled = +this.done
})

/**
 * Helpers
 */

function pruneLog (log, criteria) {
  var idx = _.sortedIndex(log, {time_done: +criteria.since}, function (item) {
    return +(new Date(item.time_done))
  })

  if (idx < log.length - 1) {
    var i = idx
    while (i > 0 && log[i].correct) {
      i--
    }

    // We want to work out how many they currently have to do
    // in khan.  So we want to know, since the last time they
    // completed the criteria, how far along are they into
    // their next iteration of the exercise.
    idx -= (idx - i) % criteria.num
  }

  return log.slice(idx)
}

function completionCriteria (exercise, since) {
  if (!(exercise.is_quiz || exercise.skill_check)) {
    var criteria = exercise.suggested_completion_criteria
    var parts = /^num_correct_in_a_row_(\d+)$/.exec(criteria)
    return {
      type: 'streak',
      num: Number(parts[1]),
      since: since
    }
  } else {
    return {
      type: 'total',
      num: exercise.all_assessment_items.length,
      since: since
    }
  }
}

function hasCompleted (criteria) {
  if (criteria.type === 'streak') {
    return function (data) {
      data.criteria = 'streak'
      data.required = criteria.num
      data.progress = data.streak
      data.done = data.longest_streak >= criteria.num

      if (data.practiced_date >= criteria.since) {
        data.done = true
      }

      return data
    }
  } else {
    return function (data) {
      data.criteria = 'total'
      data.required = criteria.num
      data.progress = data.completed
      data.done = data.completed >= criteria.num
      if (data.practiced_date >= criteria.since) {
        data.done = true
      }

      return data
    }
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
