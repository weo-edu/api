/**
 * Imports
 */

var toPromise = require('@micro-js/object-to-promise')
var pick = require('@micro-js/pick-as')
var curry = require('@micro-js/curry-once')
var activities = require('./activities')
var myActivities = require('./my-activities')
var boards = require('./boards')
var people = require('./people')
var stopWords = require('lib/stop-words')


var getOpts = curry(pick)({query: 'query.query', page: 'page', user: 'me'})

/**
 * Search actions
 */


exports.queryActivities = queryAction(activities)

exports.queryMyActivities = queryAction(myActivities)

exports.queryBoards = queryAction(boards)

exports.queryPeople = queryAction(people)


exports.counts = function (req, res, next) {
  var opts = queryStop(getOpts(req))
  return toPromise({
    my_activities: myActivities.count(opts),
    boards: boards.count(opts),
    people: people.count(opts)
  }).then(function (results) {
    res.json(results)
  }).catch(next)
}

function queryAction (query) {
  return function (req, res, next) {
    return query(queryStop(getOpts(req))).then(function(results) {
      res.json(results)
    }).catch(next)
  }
}

function queryStop(opts) {
  opts.query = stopWords(opts.query || '')
  return opts
}
