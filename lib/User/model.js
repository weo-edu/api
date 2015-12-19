/**
 * Modules
 */
var mongoose = require('mongoose')
var UserSchema = require('./schema')
var Group = require('lib/Group/model')
var passwordHash = require('password-hash')
var Following = require('lib/following')
var config = require('lib/config')
var pad = require('lib/pad-random')
var _ = require('lodash')

/**
 * Vars
 */
var following = Following.following
var follow = Following.follow
var unfollow = Following.unfollow
var followers = Following.followers


/**
 * Hooks
 */
require('./hooks')

/**
 * Instance methods
 */


UserSchema.method('joinGroup', function(group) {
  if(this.belongsTo(group.id))
    return false
  var key = group.toKey()
  this.groups.push(key)
  return true
})

UserSchema.method('leaveGroup', function(groupToLeave) {
  var id = groupToLeave.id
  if(! this.belongsTo(id))
    return false

  this.groups = this.groups.filter(function(group) {
    return group.id !== id && (!group.parent || group.parent.id !== id)
  })

  return true
})

UserSchema.method('belongsTo', function(groupId) {
  return this.groups.some(function(group) {
    return group.id === groupId
  })
})

UserSchema.method('isTeacherOf', function(student, cb) {
  if(! this.isTeacher() || ! student.isStudent())
    return cb(false)

  var overlap = _.intersection(student.groupIds, this.groupIds)
  Group.count()
    .where('_id').in(overlap)
    .where('owners.id', this.id)
    .exec(function(err, count) {
      err || count === 0
        ? cb(false)
        : cb(true)
    })
})

UserSchema.method('checkPassword', function(password) {
  return passwordHash.verify(password, this.password)
})

UserSchema.method('setPreference', function(path, value) {
  path = 'preferences.' + path
  this.set(path, value)
  this.markModified(path)
  this.markModified('preferences')
})

UserSchema.method('createProfileShare', function() {
  return this.createShare('profile', {
    channels: this.getChannel('activities'),
    public: ['teacher', 'student']
  })
})

UserSchema.method('emitProfileEvent', function(prop, content, cb) {
  var share = this.createProfileShare()
  share.object.displayName = prop
  share.object.content = content
  share.withPublic('teacher')
  share.withPublic('student')
  return share.save(cb)
})

UserSchema.method('boards', function() {
  return this.groups.filter(function(group) {
    return group.groupType === 'board'
  })
})

UserSchema.method('followBoard', function(boardId) {
  var userKey = this.toKey()

  return Group
    .findById(boardId)
    .exec()
    .then(function(board) {
      return follow(userKey, board.toKey())
        .then(function() {
          return follow(userKey, board.owners[0].toJSON(), {user: true})
        })
        .then(function() {
          return Promise.all([
            Group.updateFollowers(board.id),
            User.updateFollowers(board.owners[0].id),
            User.updateFollowing(userKey.id)
          ])
        })
    })
})

UserSchema.method('unfollowBoard', function(boardId) {
  var userId = this.id

  return Group
    .findById(boardId)
    .exec()
    .then(function(board) {
      return unfollow(userId, boardId)
        .then(function() {
          return Promise.all([
            Group.updateFollowers(board.id),
            User.syncFollowing(userId, board.owners[0].id)
          ])
        })
    })
})

UserSchema.method('followUser', function(userId) {
  var self = this

  return User
    .findById(userId)
    .exec()
    .then(function(user) {
      var userQ = follow(self.toKey(), user.toKey(), {boards: true, user: true})
      var boardQs = user.boards().map(function(board) {
        return self.followBoard(board.id)
      })

      return Promise.all(boardQs.concat(userQ))
    })
    .then(function() {
      return Promise.all([
        User.updateFollowers(userId),
        User.updateFollowing(self.id)
      ])
    })
})

UserSchema.method('unfollowUser', function(userId) {
  var self = this

  return User
    .findById(userId)
    .exec()
    .then(function(user) {
      var userQ = unfollow(self.id, userId)
      var boardQs = user.boards().map(function(board) {
        return self.unfollowBoard(board.id)
      })

      return Promise.all(boardQs.concat(userQ))
    })
    .then(function() {
      return Promise.all([
        User.updateFollowing(self.id),
        User.updateFollowers(userId)
      ])
    })
})

/**
 * Virtual properties
 */
 UserSchema.virtual('image.url').get(function() {
   return config.avatarServer + '/avatar/' + this.id
 })

/**
 * Static methods
 */

UserSchema.static('findUsernameLike', function(username, cb) {
  var User = mongoose.model('User')
  var attempt = 0
  username = username.toLowerCase()

  function find() {
    var u = pad(username.length + attempt, username)
    attempt++
    User.findOne({username: u}, function(err, user) {
      if (err) return cb(err)
      if (! user) return cb(null, u)

      find()
    })
  }

  find()
})

UserSchema.static('updateFollowing', function(id) {
  return following(id)
    .then(function(edges) {
      return User
        .findById(id)
        .exec()
        .then(function(user) {
          user.following = edges
            .filter(function(edge) {
              return edge.metadata && edge.metadata.user
            })
            .length

          return user.save()
        })
    })
})

UserSchema.static('updateFollowers', function(id) {
  return followers(id)
    .then(function(edges) {
      return User
        .findById(id)
        .exec()
        .then(function(user) {
          user.followers = edges.length
          return user.save()
        })
    })
})

UserSchema.static('updateFollowingUser', function(followerUserId, followedUserId) {
  return User
    .findById(followedUserId)
    .exec()
    .then(function(user) {
      var boardIds = user
        .boards()
        .map(function(board) {
          return board.id
        })

      // Check if we're still following any of the user's boards
      // or any of the user's
      return following(followerUserId, boardIds)
    })
    .then(function(edges) {
      if(! edges || edges.length === 0) {
        return following(followerUserId, followedUserId).then(function(edges) {
          var edge = edges[0]
          if(edge && ! edge.metadata.boards)
            return unfollow(followerUserId, followedUserId)
        })
      }
    })
})

UserSchema.static('syncFollowing', function(followerUserId, followedUserId) {
  return User.updateFollowingUser(followerUserId, followedUserId).then(function() {
    return Promise.all([
      User.updateFollowing(followerUserId),
      User.updateFollowers(followedUserId)
    ])
  })
})

/**
 * Misc. config
 */

UserSchema.set('toJSON', {
  transform: function(doc, ret) {
    // Don't send passwords over the wire (even though they're hashed)
    delete ret.password
  }
})

/**
 * Indexes
 */

UserSchema.path('username').index({unique: true})

// We have to do a custom username validation to get it to throw
// as a ValidationError rather than a MongoError
UserSchema.path('username').validate(function(value, done) {
  if(this.isModified('username') || this.isNew) {
    User.count({_id: {$ne: this._id}, username: value}, function(err, count) {
      if(err) return done(err)
      done(! count)
    })
  } else
    done(true)
}, 'Username already exists', 'unique')

UserSchema.path('email').index({unique: true, sparse: true})
UserSchema.path('email').validate(function(value, done) {
  if((this.isModified('email') || this.isNew) && value) {
    User.count({_id: {$ne: this._id}, email: value}, function(err, count) {
      if(err) return done(err)
      done(! count)
    })
  } else
    done(true)
}, 'Email already exists', 'unique')

UserSchema.index({
  'displayName': 'text',
  'email': 'text',
  'name.givenName': 'text',
  'name.familyName': 'text',
  'name.honorificPrefix': 'text',
  'username': 'text',
  'aboutMe': 'text',
  'subjects': 'text',
  'location': 'text',
  'gradeLevels': 'text',
  'website': 'text',
  'recentPins.displayName': 'text'
}, {
  name: 'UserTextIndex',
  weights: {
    'displayName': 10,
    'username': 10,
    'gradeLevels': 10,
    'subjects': 10,
    'recentPins.displayName': 3,
    'location': 2
  }
})

UserSchema.index({
  _id: -1,
  subjects: -1,
  pinCount: -1,
  followers: -1
}, {
  name: 'UserSimilarIndex'
})

/**
 * Exports
 */
var User = module.exports = mongoose.model('User', UserSchema)
