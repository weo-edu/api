/**
 * Imports
 */

var Share = require('lib/Share/model')
var Group = require('lib/Group/model')
var Student = require('lib/Student').model
var _ = require('lodash')
var async = require('async')
var analytics = require('lib/analytics')
var prep = require('track-prep')

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

exports.unlikedActivity  = function (req, res, next) {
  unlikedActivity(
    req.share.actor.toJSON(),
    req.me,
    req.share,
    (req.share.likersLength || 0) - 1
  )
  next()
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

exports.assigned = function (req, res, next) {
  var share = req.share
  var groups = req.param('to')

  groups = [].concat(groups)

  Student.find()
    .in('groups.id', groups)
    .exec(function(err, students) {
      if (err) return next(err)

      var props = prep.activity(toKey(share))
      props.numStudents = students.length
      analytics.track({
        userId: share.actor.id,
        event: 'Assigned Activity',
        properties: props
      })

      var events = []
      students.forEach(function(student) {
        groups.forEach(function (groupId) {
          studentGroup = _.find(student.groups, function(group) {
            return group.id === groupId
          })
          if (studentGroup) {
            events.push(assigned(share.actor.toJSON(), student, share, {
              displayName: studentGroup.displayName,
              id: studentGroup.id,
              url: studentGroup.url
            }))
          }
        })
      })
      async.map(events, function(evt, cb) {
        evt.save(cb)
      }, next)
    })
}

exports.annotated = function (req, res, next) {
  var share = req.body
  Share
    .findById(share._parent[0].id)
    .exec()
    .then(function (share) {
      var student = share.actor.toJSON()
      var teacher = req.me
      var group = share.contexts[0].descriptor
      return annotated(teacher, student, share, group).save(next)
    })

}

function pinnedActivity (author, pinner, activity, board) {
  analytics.track({
    userId: author.id,
    event: 'Had Activity Pinned',
    properties: prep.activity(toKey(activity))
  })

  analytics.track({
    userId: pinner.id,
    event: 'Pinned Activity',
    properties: prep.activity(toKey(activity))
  })

  return Share
    .createNotification(toKey(author), {
      status: 'pinned',
      object: toKey(activity),
      actor: toKey(pinner),
      meta: toKey(board)
    })
}

function likedActivity (author, liker, activity, likes) {
  analytics.track({
    userId: author.id,
    event: 'Had Activity Liked',
    properties: prep.activity(toKey(activity))
  })

  analytics.track({
    userId: liker.id,
    event: 'Liked Activity',
    properties: prep.activity(toKey(activity))
  })
  return Share
    .createNotification(toKey(author), {
      status: 'liked',
      object: toKey(activity),
      actor: toKey(liker),
      meta: likes
    })
}

function unlikedActivity (author, liker, activity) {
  analytics.track({
    userId: author.id,
    event: 'Had Activity Unliked',
    properties: prep.activity(toKey(activity))
  })

  analytics.track({
    userId: liker.id,
    event: 'Unliked Activity',
    properties: prep.activity(toKey(activity))
  })
}


function followedUser (followed, follower) {
  analytics.track({
    userId: followed.id,
    event: 'Had Self Followed',
    properties: prep.user(toKey(follower))
  })

  analytics.track({
    userId: follower.id,
    event: 'Followed Teacher',
    properties: prep.user(toKey(follower))
  })

  return Share
    .createNotification(toKey(followed), {
      status: 'followed_user',
      object: toKey(followed),
      actor: toKey(follower)
    })
}

function followedBoard (followed, follower) {
  analytics.track({
    userId: followed.id,
    event: 'Had Board Followed',
    properties: prep.user(toKey(follower))
  })
  analytics.track({
    userId: follower.id,
    event: 'Followed Board',
    properties: prep.user(toKey(follower))
  })
  return Share
    .createNotification(followed.owners[0], {
      status: 'followed_board',
      object: toKey(followed),
      actor: toKey(follower)
    })
}

function commentedOnActivity (activityAuthor, commentAuthor, activity) {
  analytics.track({
    userId: activityAuthor.id,
    event: 'Had Activity Commented On',
    properties: prep.activity(toKey(activity))
  })
  analytics.track({
    userId: commentAuthor.id,
    event: 'Commented On Activity',
    properties: prep.activity(toKey(activity))
  })

  return Share
    .createNotification(toKey(activityAuthor), {
      status: 'commented',
      object: toKey(activity),
      actor: toKey(commentAuthor),
      meta: {
        student: commentAuthor.isStudent()
      }
    })
}

function joinedClass (owner, group, student) {
  var props = prep.group(toKey(group))
  props.addType = 'join'
  analytics.track({
    userId: owner.id,
    event: 'Had Student Added To Class',
    properties: props
  })
  analytics.track({
    userId: student.id,
    event: 'Added Class',
    properties: props
  })
  return Share
    .createNotification(owner, {
      status: 'joined_class',
      object: toKey(group),
      actor: toKey(student)
    })
}

function turnedIn (teacher, student, activity, group) {
  var meta = toKey(group)
  meta.student = toKey(student)
  analytics.track({
    userId: teacher.id,
    event: 'Had Activity Turned In',
    properties: prep.activity(toKey(activity))
  })
  analytics.track({
    userId: student.id,
    event: 'Turned In Activity',
    properties: prep.activity(toKey(activity))
  })
  return Share
    .createNotification(teacher, {
      status: 'turned in',
      object: toKey(activity),
      actor: toKey(student),
      meta: meta
    })
}

function returned (teacher, student, activity, group) {
  var meta = toKey(group)
  meta.student = toKey(student)

  analytics.track({
    userId: student.id,
    event: 'Had Activity Returned',
    properties: prep.activity(toKey(activity))
  })

  analytics.track({
    userId: teacher.id,
    event: 'Returned Activity',
    properties: prep.activity(toKey(activity))
  })

  return Share
    .createNotification(student, {
      status: 'returned',
      object: toKey(activity),
      actor: toKey(teacher),
      meta: meta
    }, true)
}

function assigned (teacher, student, activity, group) {
  var meta = toKey(group)
  meta.student = toKey(student)
  analytics.track({
    userId: student.id,
    event: 'Had Activity Assigned',
    properties: prep.activity(toKey(activity))
  })

  return Share
    .createNotification(student, {
      status: 'assigned',
      object: toKey(activity),
      actor: toKey(teacher),
      meta: meta
    }, true)
}

function annotated (teacher, student, activity, group) {
  var meta = group.toJSON()
  meta.student = student
  analytics.track({
    userId: student.id,
    event: 'Had Activity Annotated',
    properties: prep.activity(toKey(activity))
  })
  analytics.track({
    userId: teacher.id,
    event: 'Annotated Activity',
    properties: prep.activity(toKey(activity))
  })
  return Share
    .createNotification(student, {
      status: 'annotated',
      object: toKey(activity),
      actor: toKey(teacher),
      meta: meta
    }, true)
}

/**
 * Helpers
 */

function toKey (entity) {
  return entity.toKey ? entity.toKey() : entity
}
