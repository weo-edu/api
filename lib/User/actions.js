/**
 * Imports
 */

var User = require('./model')
var Group = require('lib/Group/model')
var errors = require('lib/errors')
var mail = require('lib/mail')
var crypto = require('crypto')
var Following = require('lib/following')
var getFeaturedIds = require('lib/featured')
var searchPeople = require('lib/search/people')
var stopWords = require('lib/stop-words')

/**
 * Vars
 */

var following = Following.following
var followers = Following.followers
var followingUsers = Following.followingUsers

/**
 * Actions
 */

exports.me = function (req, res) {
  res.json(req.me)
}

exports.updateMe = function (req, res, next) {
  if(! req.auth) return next(errors.NotFound())
  req.params.id = req.auth.id
  exports.update(req, res, next)
}

exports.groups = function (groupType) {
  return function (req, res, next) {
    var user = req.me || req.user
    Group.find()
      .where('_id').in(user.groupIds)
      .where('status', 'active')
      .where('groupType', groupType)
      .lean()
      .exec(function(err, groups) {
        if(err) return next(err)
        res.json(groups)
      })
  }
}

exports.forgot = function (req, res, next) {
  var user = req.user
  crypto.randomBytes(16, function (err, buf) {
    if(err) return next(err)

    var token = buf.toString('base64').slice(0, -2)

    user.reset.token = token
    user.reset.createdAt = new Date

    user.save(function (err) {
      if (err) return next(err)

      mail.forgotPassword(user.email, {
        name: user.name.givenName || user.displayName,
        username: user.username,
        actorId: user.id,
        token: token
      }, function (err) {
        err
          ? next(err)
          : res.send(204)
      })
    })
  })
}

exports.editPassword = function (req, res, next) {
  var password = req.param('password')
  var isTemporary = (req.me && req.user.isStudent()) && (req.me.id !== req.user.id)

  req.user.password = password
  req.user.tmpPassword = isTemporary ? password : ''

  req.user.save(function (err, user) {
    err
     ? next(err)
     : res.send(200, user)
  })
}

exports.editField = function (field) {
  return function (req, res, next) {
    req.user[field] = req.param(field)
    req.user.save(function (err, user) {
      err
        ? next(err)
        : res.send(200, user)
    })
  }
}

exports.clearNotifications = function (req, res, next) {
  req.me.readNotifications = req.me.notifications.canonicalTotal.items
  req.me.save(function(err) {
    err
      ? next(err)
      : res.send(200)
  })
}

exports.follow = function (req, res, next) {
  var id = req.param('id')

  req.me
    .followUser(id)
    .then(function() { res.send(200) }, next)
}

exports.unfollow = function (req, res, next) {
  var id = req.param('id')

  req.me
    .unfollowUser(id)
    .then(function () { res.send(200) }, next)
}

exports.followers = function (req, res, next) {
  var page = req.page
  var id = req.param('id')

  followers(id)
    .skip(page.skip)
    .limit(page.limit)
    .then(function(edges) {
      var actors = edges.map(function (edge) {
        return edge.src
      })

      res.json(actors)
    })
    .then(null, next)
}

exports.following = function (req, res, next) {
  var page = req.page
  var id = req.param('id')

  followingUsers(id)
    .skip(page.skip)
    .limit(page.limit)
    .then(function (edges) {
      var actors = edges
        .map(function (edge) {
          return edge.dest
        })

      res.json(actors)
    })
    .then(null, next)
}

exports.isFollowing = function (req, res, next) {
  var id = req.param('id')
  following(req.me.id, id)
    .then(function(edges) {
      if(! edges || edges.length === 0 || ! edges[0].metadata.boards)
        return res.json({value: false})
      res.json({value: true})
    })
    .then(null, next)
}

exports.featured = function(req, res, next) {
  var ids = getFeaturedIds().filter(Boolean)
  if (ids.length === 0) {
    return res.json([])
  }

  User.find()
    .where('_id').in(ids)
    .lean()
    .exec(function(err, users) {
      if(err) return next(err)
      res.json(users)
    })
}



var ObjectId = require('mongoose').Types.ObjectId
exports.similar = function(req, res, next) {
  var me = req.me
  var page = req.page
  var query = []
    .concat(me.gradeLevels)
    .concat(me.subjects)
    .concat(me.recentPins.map(function (pin) {
      return pin.displayName
    }))
    .concat(me.location)
    .join(' ')

  query = stopWords(query)

  followingUsers(me.id)
    .then(function (edges) {
      return edges
        .map(function (edge) {
          return edge.dest
        })
        .map(function (actor) {
          return actor.id
        })
        .map(function(id) {
          return new ObjectId(id)
        })
        .concat(new ObjectId(me.id))
    })
    .then(function (userIds) {
      return searchPeople({query: query, page: page, userIds: userIds})
    })
    .then(function (users) {
      res.json(users)
    })
    .catch(next)
}

require('lib/crud')(exports, User)
