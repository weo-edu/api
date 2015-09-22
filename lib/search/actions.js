/**
 * Imports
 */

var search = require('./model')
var async = require('async')

/**
 * Search actions
 */

exports.getShares = function(req, res, next) {
  var page = req.page
  var text = req.param('query') || ''
  var options = req.shareOptions

  options.actor = req.me ? req.me.id : undefined

  search
    .shares(text, options)
    .skip(page.skip)
    .limit(page.limit)
    .toArray(function (err, shares) {
      if (err) return next(err)
      res.json(shares)
    })
}

exports.getBoards = function(req, res, next) {
  var page = req.page
  var text = req.param('query') || ''

  search
    .boards(text)
    .skip(page.skip)
    .limit(page.limit)
    .toArray(function (err, boards) {
      if (err) return next(err)
      res.json(boards)
    })
}


exports.getPeople = function(req, res, next) {
  var page = req.page
  var text = req.param('query') || ''

  search
    .people(text)
    .skip(page.skip)
    .limit(page.limit)
    .toArray(function (err, users) {
      if (err) return next(err)
      res.json(users)
    })
}

exports.getCounts = function (req, res, next) {
  var text = req.param('query') || ''

  async.parallel({
    activities: function (cb) { search.shares(text).count(cb) },
    my_activities: function (cb) {
      req.me
        ? search.shares(text, req.me.id).count(cb)
        : cb(null, 0)
    },
    boards: function (cb) { search.boards(text).count(cb) },
    people: function (cb) { search.people(text).count(cb) }
  }, function (err, counts) {
    if (err) return next(err)
    res.json(counts)
  })
}
