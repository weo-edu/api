/**
 * Imports
 */

var Share = require('lib/Share/model')
var Group = require('lib/Group/model')

/**
 * Notifications
 */

function followedUser (followed, follower) {
  return Share
    .createNotification(toKey(followed), {
      status: 'followed_user',
      object: toKey(followed),
      actor: toKey(follower)
    })
}

function followedBoard (followed, follower) {
  return Share
    .createNotification(followed.owners[0], {
      status: 'followed_board',
      object: toKey(followed),
      actor: toKey(follower)
    })
}

function pinnedActivity (author, pinner, activity, board) {
  return Share
    .createNotification(toKey(author), {
      status: 'pinned',
      object: toKey(activity),
      actor: toKey(pinner),
      meta: toKey(board)
    })
}

function likedActivity (author, liker, activity, likes) {
  return Share
    .createNotification(toKey(author), {
      status: 'liked',
      object: toKey(activity),
      actor: toKey(liker),
      meta: likes
    })
}

function commentedOnActivity(activityAuthor, commentAuthor, activity) {
  return Share
    .createNotification(toKey(activityAuthor), {
      status: 'commented',
      object: toKey(activity),
      actor: toKey(commentAuthor)
    })
}

/**
 * Middleware
 */

function middleware (type) {
  return function (req, res, next) {
    console.log('req', req.body)
    switch (type) {
      case 'pinned_activity':
        var to = req.param('to')

        Group
          .findById(Array.isArray(to) ? to[0] : to)
          .exec()
          .then(function (board) {
            pinnedActivity(
              (req.share.forked ? req.share.forked.actor : req.share.actor).toJSON(),
              req.me,
              req.share,
              board
            ).save(next)
          })
          .then(null, next)
        break
      case 'liked_activity':
        likedActivity(
          req.share.actor.toJSON(),
          req.me,
          req.share,
          req.share.likersLength
        ).save(next)
        break
      case 'followed_user':
        followedUser(
          req.user,
          req.me
        ).save(next)
        break
      case 'followed_board':
        followedBoard(
          req.group,
          req.me
        ).save(next)
        break
      case 'commented_on_activity':
        if (!req.body._parent)
          return next()

        Share
          .findById(req.body._parent[0].id)
          .exec()
          .then(function (share) {
            commentedOnActivity(
              share.actor.toJSON(),
              req.me,
              share
            ).save(next)
          })
          .then(null, next)
        break
      default:
        return next(new Error('Unknown notification type: ' + type))
    }
  }
}

/**
 * Helpers
 */

function toKey (entity) {
  return entity.toKey ? entity.toKey() : entity
}

/**
 * Exports
 */

module.exports = middleware
