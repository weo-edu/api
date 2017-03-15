/**
 * Imports
 */

var Student = require('lib/Student').model
var analytics = require('lib/analytics')
var School = require('lib/School/model')
var Share = require('lib/Share/model')
var Group = require('lib/Group/model')
var prep = require('track-prep')
var async = require('async')
var _ = require('lodash')

/**
 * Notifications
 */

exports.pinnedActivity = function (req, res, next) {
  var to = req.param('to')

  Group
    .findById(Array.isArray(to) ? to[0] : to)
    .exec()
    .then(function (board) {
      const author = (req.share.forked ? req.share.forked.actor : req.share.actor).toJSON()
      const pinner = req.me
      const activity = req.share

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
        }).save(next)
    })
    .then(null, next)
}

exports.likedActivity  = function (req, res, next) {
  const author = req.share.actor.toJSON()
  const liker = req.me
  const activity = req.share
  const likes = (req.share.likersLength || 0) + 1

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
    .save(next)
}

exports.unlikedActivity  = function (req, res, next) {
  const author = req.share.actor.toJSON()
  const liker = req.me
  const activity = req.share
  const likes = (req.share.likersLength || 0) - 1

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

  next()
}

exports.followedUser = function (req, res, next) {
  const followed = req.user
  const follower = req.me

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
    .save(next)
}

exports.followedBoard = function (req, res, next) {
  const followed = req.user
  const follower = req.me

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
    .save(next)
}

exports.commentedOnActivity = function (req, res, next) {
  if (!req.body._parent)
    return next()

  Share
    .findById(req.body._parent[0].id)
    .exec()
    .then(function (share) {
      const activityAuthor = share.actor.toJSON()
      const commentAuthor = req.me

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
        .save(next)
    })
    .then(null, next)
}

exports.joinedClass = function (req, res, next) {
  const props = prep.group(toKey(group))
  props.addType = 'join'

  const owner = req.group.owners[0]
  const group = req.group
  const student = req.me

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
    .save(next)
}

exports.turnedIn = function (req, res, next) {
  const teacher = req.share.root.actor.toJSON()
  const student = req.share.actor.toJSON()
  const activity = req.share
  const group = req.share.contexts[0].descriptor.toJSON()

  const meta = toKey(group)
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
    .save(next)
}

exports.returned = function (req, res, next) {
  const teacher = req.share.root.actor.toJSON()
  const student = req.share.actor.toJSON()
  const activity = req.share
  const group = req.share.contexts[0].descriptor.toJSON()

  const meta = toKey(group)
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
    .save(next)
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

exports.joinedSchool = function (req, res, next) {
  var schoolId = req.param('id')

  School
    .get(schoolId)
    .then(
      school => {
        analytics.track({
          userId: req.me.id,
          event: 'Joined School',
          properties: school
        })

        next()
      },
      next
    )
}

exports.annotated = function (req, res, next) {
  var share = req.body

  Share
    .findById(share._parent[0].id)
    .exec()
    .then(function (activity) {
      var student = activity.actor.toJSON()
      var teacher = req.me
      var group = activity.contexts[0].descriptor

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
        .save(next)
    })
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

/**
 * Helpers
 */

function toKey (entity) {
  return entity.toKey ? entity.toKey() : entity
}
