/**
 * Imports
 */

var mongo = require('lib/mongo')


/**
 * Search
 */

function shares (query, actorId) {
  var activities = mongo.raw.collection('shares')
  var opts = {
    published: true,
    $text: {$search: query || ''},
    'contexts.descriptor.id': 'public'
  }

  if (actorId) {
    opts['actor.id'] = actorId
  }

  return activities
    .find(opts, {score: {$meta: 'textScore'}})
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