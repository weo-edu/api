var access = require('lib/access')
var overlaps = require('overlaps')
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var ObjectSchema = require('lib/Object/schema')
var UserSchema = require('lib/User/schema')
var selfLink = require('lib/schema-plugin-selflink')
var foreignKey = require('lib/schema-plugin-foreign-key')
var asArray = require('as-array')
var qs = require('querystring')

var ShareSchema = module.exports = new Schema({
  shareType: {
    type: String,
    default: 'share'
  },
  title: {
    type: String,
  },
  displayName: {
    type: String,
  },

  /**
   * type of share
   * @type {Object}
   *
   * Implemented by virtual
   */

  /**
   * time share is `activated`
   * @type {Date}
   */
  publishedAt: Date,
  published: {
    type: Boolean,
    default: false
  },
  /**
   * deny access to this userType
   * @type {String}
   */
  deny: String,
  /**
   * The shares verb, indicating kind of share performed.
   * @type {Object}
   */
  verb: {
    type: String,
    required: true
  },
  /**
   * The person who performs the activity
   * @type {Object}
   *
   * @field id The id of the user
   * @field displayName The display name of the user
   * @field url The link to the profile of the user (virtual)
   * @field image.url The url of the avatar for the user
   */
  actor: UserSchema.foreignKey.embed(),
  /**
   * Specifies who will receive share.
   * @type {Object}
   *
   * @field contexts[].id Id of location where share is sent. Typically a class.
   * @field contexts[].access[] Describes who can see the share at the specified location. `type`:`id`
   */
  contexts: [access.AddressSchema],
  /**
   * Replies to this share
   * @type {SelfLink}
   */
  replies: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.getChannel('replies')})
  }),
  /**
   * Collection of shareInstances for this share
   * @return {selfLink}
   */
  instances: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.getChannel('instances')})
  }, [
    {property: 'status', type: Number, replace: true, root: true},
    {property: 'points.scaled', replace: true, as: 'pointsScaled'},
    {property: 'at.turnedIn', replace: true, root: true, type: Date, as: 'turnedInAt'}
  ]),
  /**
   * Channel to post share on.
   * @type {String}
   */
  channels: {
    type: [String],
  },
  discussion: {
    type: Boolean,
    default: false
  },
  students: selfLink.embed(function() {
    return '/share/' + this.id + '/members' //XXX make sure count is right
  }),

  tags: [String],

  description: String,

  originalDescription: String,

  image: {},

  likers: [UserSchema.foreignKey.embed()],

  likersLength: Number,

  fork: Boolean

}, {discriminatorKey: 'shareType'})

ShareSchema.plugin(foreignKey, {
  model: 'Share',
  transform: function(key) {
    key.actor = this.actor.toJSON()
    if (this.object && this.object.toKey) {
      key = this.object.toKey(key)
    }
    return key
  }
})

ShareSchema.foreignKey.add({
  actor: UserSchema.foreignKey.embed()
})

ShareSchema.plugin(require('lib/schema-plugin-nested'))

/**
 * Nested array properties
 */
ShareSchema.nested('root', ShareSchema.foreignKey)
ShareSchema.nested('parent', ShareSchema.foreignKey)
ShareSchema.nested('forked', ShareSchema.foreignKey)
ShareSchema.nested('forkedSource', ShareSchema.foreignKey)
/**
 * The object of the share.
 * @type {Object}
 *
 * @field type Type of object.
 * @field content Formatted content, suitable for display.
 * @field content The content provided by the author.
 */
ShareSchema.nested('object', ObjectSchema)

ShareSchema.virtual('url').get(function() {
  return '/activity/' + (this.root ? this.root.id : this.id) + '/'
})

/**
 * Check to see if we are a root-level share
 * @return {Boolean} root or not
 */
ShareSchema.method('isRoot', function() {
  return !this.root || this.root === this.id
})

ShareSchema.method('canEdit', function(user) {
  return this.isOwner(user)
})

ShareSchema.method('isRootOwner', function(user) {
  var userId = user.id || user
  return userId === this.root.actor.id
})

ShareSchema.method('isOwner', function(user) {
  var id = user.id || user
  return this.actor.id === id
})


/**
 * Child share creation
 */

ShareSchema.static('create', function(objectType) {
  var Share = mongoose.model('Share')
  return new Share({object: {objectType: objectType}})
})

ShareSchema.method('createChild', function(objectType, options) {
  options = options || {}

  var share = ShareSchema.Model.create(objectType)
  share.set({
    parent: this.toKey(),
    root: this.root || this.toKey()
  })

  share.contexts = this.contextList(options.contexts).slice(0)
  if (options.channels)
    share.channels = asArray(options.channels)

  return share
})

ShareSchema.method('createEvent', function(statusName, actor) {
  var channels = []
  var User = mongoose.model('User')

  if(actor) {
    channels.push(User.path(actor, 'activities'))
    channels.push(User.path(this.actor.toJSON(), 'activities'))
  } else {
    actor = this.actor.toJSON()
    channels.push(User.path(actor, 'activities'))
  }

  var channel = User.path(actor, 'activities')
  var evt = this.createChild('status', {channels: channels})

  evt.set({actor: actor})
  evt.object.instance = this.isInstance()
  evt.object.status = statusName

  evt.withPublic('teacher')
  evt.withPublic('student')

  return evt
})

/**
 *  Contexts / Access
 */
ShareSchema.virtual('contextIds').get(function() {
  return this.contexts.map(function(ctx) {
    return ctx.descriptor.id
  })
})

// This shouldnt be necessary in new workflow
/*ShareSchema.path('contexts').validate(function(val) {
  if (val.length === 1 && this.isSheet() && this.isPublished())
    return val[0].descriptor.id !== 'public'
  else
    return !!val.length
}, 'Contexts required', 'required')*/

ShareSchema.method('context', function(foreignKey) {
  var id = foreignKey.id || foreignKey
  var len = this.contexts.length

  for(var i = 0; i < len; i++)
    if(this.contexts[i].descriptor.id === id)
      return this.contexts[i]

  return null
})

ShareSchema.method('contextsForUser', function(user) {
  return this.contexts.filter(function(context) {
    return overlaps(context.tokens(), user.tokens(context.descriptor.id))
  })
})

ShareSchema.method('contextList', function(addresses) {
  if (!addresses || !addresses.length)
    return this.contexts

  // Normalize the addresses to be ids
  addresses = addresses.map(function(addr) {
    return addr.id || addr
  })

  return this.contexts.filter(function(ctx) {
    return addresses.indexOf(ctx.descriptor.id) !== -1
  })
})

ShareSchema.method('ensureContext', function(contextKey) {
  var context = this.context(contextKey)
  if(! context) {
    this.contexts.unshift({
      descriptor: foreignKey.toAbstractKey(contextKey)
    })
    context = this.contexts[0]
  }

  return context
})

ShareSchema.method('withGroup', function(model) {
  // If we've been passed a class, the
  // parent is the class
  var parent = model.parent || model.toKey()
  if(parent.toJSON)
    parent = parent.toJSON()

  this.ensureContext(parent)
    .grant('group', 'teacher', model)
    .grant('group', 'student', model)
})

ShareSchema.method('withGroups', function(groups) {
  var self = this
  groups.forEach(function(group) {
    self.withGroup(group)
  })
})

ShareSchema.method('withStudent', function(context, userModel) {
  this.ensureContext(context.toKey())
    .grant('user', 'student', userModel)
    .grant('group', 'teacher', context)
  return this
})

ShareSchema.method('withMe', function(userModel) {
  this.ensureContext(access.me)
    .grant('user', 'teacher', userModel)
})

ShareSchema.method('withPublic', function(type) {
  type = type || 'teacher'
  this.ensureContext(access.public)
    .grant('public', type)
})


/**
 * Channels
 */
ShareSchema.method('addChannel', function(channel) {
  if(this.channels.indexOf(channel) === -1)
    this.channels.push(channel)
})

ShareSchema.method('draftChannel', function() {
  var User = mongoose.model('User')
  return User.path(this.actor, 'drafts')
})

ShareSchema.method('sendToDrafts', function() {
  this.channels = [this.draftChannel()]
})

ShareSchema.method('sendToGroups', function(groups) {
  var Group = mongoose.model('Group')
  if (!groups) {
    groups = this.contexts.filter(function(context) {
      // XXX this should not be necessary
      return context.descriptor.id !== 'public'
    }).map(function(context) {
      return context.descriptor
    })
  }
  this.channels = groups.map(function(group) {
    return Group.path(group, 'board')
  })
})

ShareSchema.method('isPublished', function() {
  return this.published
})

ShareSchema.method('isDraft', function() {
  return ! this.published
})

ShareSchema.method('isTemporary', function() {
  return this.channels.length === 0
})



/**
 * Share types
 */


ShareSchema.static('isInstance', function(share) {
  return share.shareType === 'shareInstance'
})

ShareSchema.static('isSheet', function(share) {
  var obj = share._object && share._object[0]
  return obj && obj.objectType === 'section' && share.shareType === 'share'
})

ShareSchema.static('isAnnotation', function(share) {
  return share.shareType === 'annotation'
})

ShareSchema.static('isProfileShare', function(share) {
  var Share = mongoose.model('Share')
  return !Share.isSheet(share) && !Share.isInstance(share) && !Share.isAnnotation(share)
})

ShareSchema.method('isSheet', function() {
  var Share = mongoose.model('Share')
  return Share.isSheet(this)
})

ShareSchema.method('isInstance', function() {
  var Share = mongoose.model('Share')
  return Share.isInstance(this)
})

ShareSchema.method('isAnnotation', function() {
  var Share = mongoose.model('Share')
  return Share.isAnnotation(this)
})

ShareSchema.method('isPublic', function() {
  return this.contexts.length &&
    this.contexts[0].descriptor.id === 'public'
})

ShareSchema.method('board', function() {
  var context = this.contexts[1]
  return context && context.descriptor
})

/**
 * Additional Config
 */

ShareSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.object
  }
})

ShareSchema.plugin(selfLink)
ShareSchema.ShareInstance = require('./shareInstanceSchema')
require('./Profile/schema')
