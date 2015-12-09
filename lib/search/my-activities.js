/**
 * Imports
 */

var mongo = require('lib/mongo')
var toPromise = require('@micro-js/thunk-to-promise')
var activitiesWhere = require('./activities-where')
var getWhere = activitiesWhere({published: true, actor: true})
var count = require('./count')

/**
 * Expose query
 */

module.exports = query

function query (opts) {
  var query = opts.query
  var page = opts.page
  var user = opts.user
  var where = getWhere(query, opts)
  var queryInstance = collection()
    .find(where)
    .skip(page.skip)
    .limit(page.limit)
  return toPromise.call(queryInstance, queryInstance.toArray)
}

query.count = count(collection, getWhere)

function collection () {
  return mongo.raw.collection('shares')
}
