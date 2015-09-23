/**
 * Imports
 */

var mongo = require('lib/mongo')
var _ = require('lodash')
var is = require('@weo-edu/is')

/**
 * Exports
 */

exports.shares = shares
exports.people = people
exports.boards = boards

/**
 * Search
 */

function shares (opts) {
  opts = opts || {}
  return function (req) {
    var options = _.clone(opts)
    var query = getQuery(req)
    var actorId = req.me ? req.me.id : undefined

    var activities = mongo.raw.collection('shares')

    var where = _.defaults({
      published: options.published,
      $text: {$search: query || ''},
      'contexts.descriptor.id': 'public'
    }, {published: true})


    if (!is.undefined(options.fork))
      where.fork = options.fork

    if (options.actor && actorId) {
      where['actor.id'] = actorId
    }

    return activities
      .find(where, {score: {$meta: 'textScore'}})
      .sort({score: {$meta: 'textScore'}})
  }
}

function boards (req) {
  var query = getQuery(req)
  var groups = mongo.raw.collection('groups')

  return groups
    .find({
      $text: {$search: query || ''},
      groupType: 'board',
      status: 'active'
    }, {score: {$meta: 'textScore'}})
    .sort({score: {$meta: 'textScore'}})
}

function people (req) {
  var query = getQuery(req)
  var users = mongo.raw.collection('users')

  return users
    .find({
      $text: {$search: query || ''},
      userType: 'teacher'
    }, {score: {$meta: 'textScore'}})
    .sort({score: {$meta: 'textScore'}})
}

function getQuery (req) {
  return req.param('query') || ''
}
