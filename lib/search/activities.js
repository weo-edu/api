/**
 * Imports
 */

var mongo = require('lib/mongo')
var curry = require('@micro-js/curry-once')
var toPromise = require('@micro-js/thunk-to-promise')
var activitiesWhere = require('./activities-where')
var getWhere = activitiesWhere({published: true, fork: false})
var count = require('./count')

/**
 * Expose query
 */

module.exports = query

function query(opts) {
  var queryStr = opts.query
  var page = opts.page
  var where = getWhere(queryStr, opts)
  return toPromise(curry.call(collection(), collection().aggregate)(
    matchFilterPipeline(where).concat([
    {
      $sort: {fields: -1, _id: -1}
    },
    {
      $skip: page.skip
    },
    {
      $limit: page.limit
    }
  ]))).then(function (results) {
    return results.map(function (result) {
      result.document.score = result.score
      return result.document
    })
  })
}



query.count = function (opts) {
  var queryStr = opts.query
  var where = getWhere(queryStr, opts)
  return toPromise(curry.call(collection(), collection().aggregate)(
    matchFilterPipeline(where).concat([
    {
      $group: {_id: null, count: {$sum: 1}}
    }
  ]))).then(function (results) {
    return results[0] && results[0].count
  })
}

function matchFilterPipeline (where) {
  return [
    {
      $match: where
    },
    {
      $project: {
        score: {
          $meta: 'textScore'
        },
        fields: {
          $add: [
            {$meta: 'textScore'},
            {$multiply: [10.0, {$add: ['$repinCount', '$likersLength']}]}
          ]
        },
        document: '$$ROOT'
      }
    },
    {
      $match: {
        score: {$gt: 2}
      }
    }
  ]
}

function collection () {
  return mongo.raw.collection('shares')
}
