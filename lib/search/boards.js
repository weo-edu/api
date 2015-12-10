/**
 * Import
 */

var mongo = require('lib/mongo')
var toPromise = require('@micro-js/thunk-to-promise')
var count = require('./count')

/**
 * Expose query
 */

module.exports = query

function query (opts) {
  var query = opts.query
  var page = opts.page
  var user = opts.user
  var where = getWhere(query, user)
  var queryInstance = collection()
    .find(where)
    .skip(page.skip)
    .limit(page.limit)
  return toPromise.call(queryInstance, queryInstance.toArray)
}

query.count = count(collection, getWhere)

function collection () {
  return mongo.raw.collection('groups')
}

function getWhere (query) {
  query = query || ''

  return {
    $text: {$search: query || ''},
    groupType: 'board',
    status: 'active'
  }
}
