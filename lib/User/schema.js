var validations = require('lib/validations')
var access = require('lib/access')
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var selfLink = require('lib/schema-plugin-selflink')
var asArray = require('as-array')
var parseName = require('parse-name')
var qs = require('querystring')

var UserSchema = module.exports = new Schema({
  email: {
    type: String,
    unique: true,
    validate: [
      validations.email,
      'Invalid email address',
      'email'
    ]
  },
  displayName: {
    type: String,
    requred: true,
  },
  invitations: {
    type: Number,
    default: 3
  },
  admin: Boolean,
  inviteCode: String,
  followers: {
    type: Number,
  },
  following: {
    type: Number,
  },
  readNotifications: {
    type: Number,
    default: 0
  },
  name: {
    givenName: {
      type: String,
      editableBy: ['me', 'teacher']
    },
    familyName: {
      type: String,
      editableBy: ['me', 'teacher']
    },
    honorificPrefix: {
      type: String,
      editableBy: ['me', 'teacher'],
      enum: parseName.titles.concat('')
    }
  },
  username: {
    type: String,
    required: true,
    editableBy: ['me', 'teacher'],
    validate: [
      validations.minLength(3),
      'Must be at least 3 characters',
      'minLength'
    ]
  },
  password: {
    type: String,
    required: true,
    trusted: true,
    editableBy: ['me', 'teacher'],
    validate: [
      validations.minLength(6),
      'Password must be at least 6 characters long',
      'minLength'
    ]
  },
  preferences: {
    type: {},
    default: {}
  },
  aboutMe: {
    type: String
  },
  website: {
    type: String,
    validate: [
      function(str) {
        return !str || validations.url(str)
      },
      'Invalid URL',
      'url'
    ]
  },
  location: {
    type: String
  },
  subjects: {
    type: Array
  },
  gradeLevels: {
    type: Array
  },
  color: {
    type: String
  },
  userType: {
    type: String
  },
  sisId: {
    type: String,
    editableBy: ['me', 'teacher']
  },
  activities: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.getChannel('activities')})
  }),
  notifications: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.getChannel('notifications')})
  }),
  drafts: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.getChannel('drafts')})
  }),
  trash: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.getChannel('trash')})
  }),
  reset: {
    token: String,
    createdAt: Date
  },
  auth: {
    google: {
      id: String,
      access_token: String,
      refresh_token: String
    },
    office365: {
      id: String,
      access_token: String,
      refresh_token: String
    },
    facebook: {
      id: String,
      access_token: String
    },
    clever: {
      id: String,
      access_token: String
    },
    khan: {
      oauth_token: String,
      oauth_token_secret: String,
      oauth_verifier: String,
      access_token: String,
      access_token_secret: String
    }
  },
  pinCount: {
    type: Number
  },
  recentPins: [{}],
  recentAssigns: [{}]
}, {id: true, _id: true, discriminatorKey: 'userType'})

// Kind of a hack to work around the fact that Group/User schemas
// require each other
UserSchema.on('init', function() {
  var GroupSchema = require('lib/Group/schema')
  UserSchema.add({
    groups: [GroupSchema.foreignKey]
  })
})

UserSchema.plugin(require('lib/schema-plugin-foreign-key'), {
  model: 'User',
  transform: function (key) {
    key.url = '/' + this.id + '/'
    key.image = key.image || {}
    key.image.url = this.image.url
    key.username = this.username

    if (this.color) {
      key.color = this.color
    }

    return key
  }
})

UserSchema.plugin(selfLink)

UserSchema.foreignKey.add({
  color: {
    type: String
  },
  username: String
})

/**
 * Name Virtuals
 */

UserSchema.path('username').validate(
  validations.alphanumericdash,
  'Username may only contain letters and numbers',
  'alphanumeric'
)

/**
 * Virtuals
 */
UserSchema.virtual('url').get(function() {
  return '/' + this.id
})

UserSchema.virtual('groupIds').get(function() {
  var ids = []

  if (this.groups) {
    this.groups.forEach(function(group) {
      if(group.status === 'active')
        ids.push(group.id)
    })
  }

  return ids
})

/**
 * Name
 */

UserSchema.method('setDisplayName', function() {
  this.displayName = parseName.compose({
    title: this.name.honorificPrefix,
    first: this.name.givenName,
    last: this.name.familyName
  }, {respectful: true})
})

UserSchema.virtual('name.full').get(function () {
  return parseName.compose({
    title: this.name.honorificPrefix,
    first: this.name.givenName,
    last: this.name.familyName
  }, {full: true})
}).set(function (name) {
  var parsed = parseName.parse(name)

  this.name.givenName = parsed.first
  this.name.familyName = parsed.last
  this.name.honorificPrefix = parsed.title
})

UserSchema.virtual('name.formatted').get(function () {
  return parseName.compose({
    first: this.name.givenName,
    last: this.name.familyName
  })
})

UserSchema.method('hasGoogle', function () {
  return !! (this.auth && this.auth.google && this.auth.google.refresh_token)
})

UserSchema.method('hasKhan', function () {
  return !! (this.auth && this.auth.khan && this.auth.khan.access_token)
})


/**
 * Access
 */

// Return a user's access entries
UserSchema.method('tokens', function(context) {
  var self = this
  return (this.groups || []).filter(function(group) {
    return group.status === 'active'
      && (!context
          || group.id === context
          || (group.parent && group.parent.id === context))
  }).map(function(group) {
    return access.encode('group', self.userType, group.id)
  }).concat([
    // Defaults for all users
    access.encode('public', this.userType),
    access.encode('user', this.userType, this.id)
  ])
})

UserSchema.method('isStudent', function() {
  return this.userType === 'student'
})

UserSchema.method('isTeacher', function() {
  return this.userType === 'teacher'
})

UserSchema.method('isMemberOf', function(group) {
  // Allow a model or id to be passed in
  var groupId = group.id || group
  return this.groups.some(function(group) {
    return group.id === groupId
  })
})

UserSchema.method('createShare', function(objectType, options) {
  options = options || {}
  var Share = mongoose.model('Share')
  var share = Share.create(objectType)
  share.set({actor: this.toKey()})
  if (options.channels)
    share.channels = asArray(options.channels)

  options.groups && options.groups.forEach(function(group) {
    share.withGroup(group)
  })

  return share
})

UserSchema.method('createSection', function(options) {
  options = options || {}
  options.public = true
  return this.createShare('section', options)
})

UserSchema.method('numUnreadNotifications', function() {
  return this.notifications.canonicalTotal.items - this.readNotifications
})

UserSchema.static('path', function(user, property) {
  var id = user.id || user
  return 'user!' + id + '.' + property
})
