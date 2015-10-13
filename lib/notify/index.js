/**
 * Imports
 */

var Share = require('lib/Share/model')
var Group = require('lib/Group/model')

/**
 * Notifications
 */

exports.pinnedActivity = function (req, res, next) {
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
}

exports.likedActivity  = function (req, res, next) {
  likedActivity(
    req.share.actor.toJSON(),
    req.me,
    req.share,
    (req.share.likersLength || 0) + 1
  ).save(next)
}

exports.followedUser = function (req, res, next) {
  followedUser(
    req.user,
    req.me
  ).save(next)
}

exports.followedBoard = function (req, res, next) {
  followedBoard(
    req.group,
    req.me
  ).save(next)
}

exports.commentedOnActivity = function (req, res, next) {
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
}

exports.joinedClass = function (req, res, next) {
  joinedClass(
    req.group.owners[0],
    req.group,
    req.me
  ).save(next)
}

exports.turnedIn = function (req, res, next) {
  turnedIn(
    req.share.root.actor.toJSON(),
    req.share.actor.toJSON(),
    req.share,
    req.share.contexts[0].descriptor.toJSON()
  ).save(next)
}

exports.returned = function (req, res, next) {
  returned(
    req.share.root.actor.toJSON(),
    req.share.actor.toJSON(),
    req.share,
    req.share.contexts[0].descriptor.toJSON()
  ).save(next)
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

function commentedOnActivity(activityAuthor, commentAuthor, activity) {
  return Share
    .createNotification(toKey(activityAuthor), {
      status: 'commented',
      object: toKey(activity),
      actor: toKey(commentAuthor)
    })
}

function joinedClass (owner, group, student) {
  return Share
    .createNotification(owner, {
      status: 'joined_class',
      object: toKey(group),
      actor: toKey(student)
    })
}

function turnedIn (teacher, student, activity, group) {
  return Share
    .createNotification(teacher, {
      status: 'turned in',
      object: toKey(activity),
      actor: toKey(student),
      meta: toKey(group)
    })
}

function returned (teacher, student, activity, group) {
  console.log('create return notification', teacher, student)
  return Share
    .createNotification(student, {
      status: 'returned',
      object: toKey(activity),
      actor: toKey(teacher),
      meta: toKey(group)
    })
}

/**
 * Helpers
 */

function toKey (entity) {
  return entity.toKey ? entity.toKey() : entity
}
