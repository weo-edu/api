/**
 * Modules
 */
var mongoose = require('mongoose')
var UserSchema = require('./schema')
var Group = require('lib/Group/model')
var passwordHash = require('password-hash')
var config = require('lib/config')
var pad = require('lib/pad-random')
var _ = require('lodash')


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

UserSchema.method('addressQuery', function(context) {
  return {
    contexts: {
      $elemMatch: {
        'descriptor.id': context,
        'allow.id': {$in: this.tokens(context)}
      }
    }
  }
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
  'aboutMe': 'text'
}, {
  name: 'UserTextIndex',
})

/**
 * Exports
 */
var User = module.exports = mongoose.model('User', UserSchema)