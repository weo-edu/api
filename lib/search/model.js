/**
 * Imports
 */

var mongo = require('lib/mongo')
var _ = require('lodash')

/**
 * Search
 */

function shares (query, options) {
  options = options || {}
  var actorId = options.actor
  var activities = mongo.raw.collection('shares')

  var where = _.defaults({
    published: options.published,
    $text: {$search: query || ''},
    'contexts.descriptor.id': 'public'
  }, {published: true})


  if (actorId) {
    where['actor.id'] = actorId
  }

  console.log('where', where)

  return activities
    .find(where, {score: {$meta: 'textScore'}})
    .sort({score: {$meta: 'textScore'}})
}

function boards (query) {
  var groups = mongo.raw.collection('groups')

  return groups
    .find({
      $text: {$search: query || ''},
      groupType: 'board',
      status: 'active'
    }, {score: {$meta: 'textScore'}})
    .sort({score: {$meta: 'textScore'}})
}

function people (query) {
  var users = mongo.raw.collection('users')

  return users
    .find({
      $text: {$search: query || ''},
      userType: 'teacher'
    }, {score: {$meta: 'textScore'}})
    .sort({score: {$meta: 'textScore'}})
}

/**
 * Exports
 */

module.exports = {
  shares: shares,
  people: people,
  boards: boards
}
