/**
 * Imports
 */
var hashid = require('lib/hashid')
var Seq = require('seq')
var Seq = require('seq')
var Schema = require('./schema')
var mongoose = require('mongoose')
var Following = require('lib/following')

/**
 * Vars
 */
var followers = Following.followers

/**
 * Pre/post validate
 */

Schema.pre('validate', function addAccessCode(next) {
  var group = this

  if(group.isNew && ! group.code) {
    // The ! this.code check is primarily there to allow our tests
    // to send specially crafted codes.  However, it shouldn't be a
    // problem if someone wants to specify their code, as long as its
    // unique
    (function attempt(code, next) {
      group.constructor.findOne({code: code}, function(err, oldGroup) {
        if(err) return next(err)
        if(oldGroup) return attempt(hashid(), next)
        group.code = code
        next()
      })
    })(hashid(), next)
  } else
    next()
})

/**
 * Pre save/remove
 */

Schema.pre('save', function inductOwners(next) {
  if(! (this.isNew || this.isModified('owners')))
    return next()

  var group = this
  mongoose.model('User').find()
    .where('_id').in(group.ownerIds)
    .exec(function(err, users) {
      Seq(users)
        .parEach(function(user) {
          user.joinGroup(group)
          user.save(this)
        })
        .seq(function() { next() })
        .catch(next)
    })
})

/**
 * Post save/remove
 */

Schema.post('remove', function dismissMembers(group, next) {
  // When a group is removed, take it out of everyone's group lists
  User.leaveGroup(null, group._id, function(err) { next(err) })
})

Schema.post('save', function followNewBoards(group, next) {
  if(! group.wasNew) return next()
  if(group.groupType !== 'board') return next()

  followers(group.owners[0].id).then(function(edges) {
    var qs = edges
        .filter(function(edge) {
          return edge.metadata && edge.metadata.boards
        })
        .map(function(edge) {
          return mongoose.model('User')
            .findById(edge.src.id)
            .exec()
            .then(function(user) {
              return user.followBoard(group.id)
            })
        })

    return Promise.all(qs).then(function() { next() }, next)
  })
})

Schema.post('save', function unfollow (group, next) {
  if(group.groupType !== 'board')
    return next()
  if(! (group.status === 'archived' && group.wasModified('status')))
    return next()

  followers(group.id).then(function (edges) {
    var qs = edges.map(function (edge) {
      return mongoose.model('User')
        .findById(edge.src.id)
        .exec()
    })

    return Promise.all(qs).then(function (users) {
      var qs = users.map(function (user) {
        return user.unfollowBoard(group.id)
      })

      return Promise.all(qs)
    })
  }).then(function () { next() }, next)
})