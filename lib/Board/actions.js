/**
 * Imports
 */
var Following = require('lib/following')

/**
 * Vars
 */
var following = Following.following
var followers = Following.followers

/**
 * Actions
 */
exports.follow = function(req, res, next) {
  var id = req.param('id')

  req.me
    .followBoard(id)
    .then(function() { res.send(200) }, next)
}

exports.unfollow = function(req, res, next) {
  var id = req.param('id')

  req.me
    .unfollowBoard(id)
    .then(function() { res.send(200) }, next)
}

exports.followers = function(req, res, next) {
  var id = req.param('id')

  followers(id)
    .then(function(edges) {
      var actors = edges.map(function(edge) {
        return edge.src
      })

      res.json(actors)
    })
    .then(null, next)
}

exports.isFollowing = function(req, res, next) {
  var id = req.param('id')

  following(req.me.id, id)
    .then(function(edges) {
      if(! edges || edges.length === 0)
        return res.send(404)
      res.send(200)
    })
    .then(null, next)
}