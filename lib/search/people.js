/**
 * Imports
 */

var mongo = require('lib/mongo')
var curry = require('@micro-js/curry-once')
var toPromise = require('@micro-js/thunk-to-promise')
var count = require('./count')

/**
 * Expose query
 */

module.exports = query

function query(opts) {
  var query = opts.query
  var page = opts.page
  var where = getWhere(query, opts)
  return toPromise(curry.call(collection(), collection().aggregate)([
    {
      $match: where
    },
    {
      $project: {
        score: {
          $add: [
            {$meta: 'textScore'},
            {$multiply: [0.03, {$add: ['$followers', '$pinCount']}]}
          ]
        },
        document: '$$ROOT'
      }
    },
    {
      $sort: {score: -1, _id: -1}
    },
    {
      $skip: page.skip
    },
    {
      $limit: page.limit
    }
  ])).then(function (results) {
    return results.map(function (result) {
      result.document.score = result.score
      return result.document
    })
  })
}

query.count = count(collection, getWhere)

function collection () {
  return mongo.raw.collection('users')
}

function getWhere (query, opts) {
  var w = {
    $text: {$search: query || ''},
    userType: 'teacher'
  }
  if (opts.userIds) {
    w._id = {$nin: opts.userIds}
  }
  return w
}
