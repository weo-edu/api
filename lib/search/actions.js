/**
 * Imports
 */

var async = require('async')

/**
 * Search actions
 */


exports.get = function(search) {
  return function(req, res, next) {
    var page = req.page

    search(req)
      .skip(page.skip)
      .limit(page.limit)
      .toArray(function (err, items) {
        if (err) return next(err)
        res.json(items)
      })
  }

}


exports.getCounts = function(activities, myActivities, boards, people) {
  return function (req, res, next) {
    async.parallel({
      activities: function (cb) {
        activities(req).count(cb)
      },
      my_activities: function (cb) {  myActivities(req).count(cb)},
      boards: function (cb) { boards(req).count(cb) },
      people: function (cb) { people(req).count(cb) }
    }, function (err, counts) {
      if (err) return next(err)
      res.json(counts)
    })
  }
}
