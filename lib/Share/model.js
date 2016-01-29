/**
 * Imports
 */

var mongoose = require('mongoose')
var ShareSchema = require('./schema')
var channel = require('lib/channel')
var Statuses = require('./status')
var access = require('lib/access')
var asArray = require('as-array')
var async = require('async')
require('lib/Student/model')

/**
 * Install hooks
 */

require('./hooks')

/**
 * Static methods
 */

ShareSchema.static('findInstances', function (id) {
  return Share.find()
    .where('channels', Share.getChannel('share', id, 'instances'))
    .where('shareType', 'shareInstance')
})

ShareSchema.static('createNotification', function (recipient, object, noStream) {
  var User = mongoose.model('User')
  var evt = Share.create('status')
  var channels
  if (noStream) {
    channels = []
  } else {
    channels = [User.path(object.actor.id, 'activities')]
  }

  if (object.actor.id !== recipient.id)
    channels.push(User.path(recipient, 'notifications'))

  object.objectType = 'status'

  evt.set({
    channels: channels,
    shareType: 'notification',
    object: object,
    actor: {
      id: recipient.id,
      displayName: recipient.displayName,
      username: recipient.username,
      url: recipient.url
    }
  })

  evt.withPublic('teacher')
  evt.withPublic('student')

  return evt
})

/**
 * Instance methods
 */

ShareSchema.method('removeDuplicates', function () {
  function recurse (attachments) {
    var seen = {}

    return attachments.reduce(function (memo, obj) {
      if (! seen[obj._id]) {
        seen[obj._id] = true
        obj.attachments = recurse(obj.attachments)
        memo.push(obj)
      }

      return memo
    }, [])
  }

  this.object.attachments = recurse(this.object.attachments)
})

ShareSchema.method('channelModels', function (cb) {
  channel.models(this.channels, cb)
})

ShareSchema.method('deleteInstances', function (cb) {
  this.findInstances().remove(cb)
})

ShareSchema.method('findInstances', function () {
  return this.constructor.findInstances(this.id)
})

ShareSchema.method('tokens', function () {
  var cache = {}
  return this.contexts.filter(function (context) {
    // We blacklist as opposed to whitelisting here
    // because contexts may theoretically be things
    // other than groups
    return context.descriptor.status !== 'archived'
  }).reduce(function (memo, context) {
    context.tokens().forEach(function (token) {
      if(! cache[token]) {
        cache[token] = true
        memo.push(token)
      }
    })

    return memo
  }, [])
})

ShareSchema.method('instanceProperties', function (opts) {
  return {
    displayName: this.displayName,
    contexts: this.contextList(asArray(opts.context)),
    tags: this.tags,
    description: this.description,
    discussion: this.discussion,
    root: this.toKey(),
    parent: this.toKey()
  }
})

ShareSchema.method('isNotification', function() {
  return this.shareType === 'notification'
})

ShareSchema.method('createInstance', function(opts) {
  opts = opts || {}
  var inst = new ShareInstance({
    shareType: 'shareInstance',
    status: Statuses.unopened,
    channels: [
      this.getChannel('instances')
    ],
    object: this.object.toJSON(),
    actor: opts.user.toKey()
  })

  inst.set(this.instanceProperties(opts))

  inst.set({
    'replies.selfLink': this.replies.selfLink,
    'instances.selfLink': this.instances.selfLink,
    'students.selfLink': this.students.selfLink
  })

  return inst
})

ShareSchema.method('getMembers', function(contexts) {
  contexts = asArray(contexts || this.contextIds)

  var individuals = []
  var groups = []

  this.contextList(contexts).forEach(function(address) {
    address.allow.map(function(allow) {
      return access.decode(allow.id)
    }).filter(function(entry) {
      // Skip public
      return !! entry.id
    }).forEach(function(entry) {
      if(entry.type === 'user')
        individuals.push(entry.id)
      else if(entry.type === 'group' && entry.role === 'student')
        groups.push(entry.id)
    })
  })

  var Student = mongoose.model('student')
  return Student.find()
    .or([{_id: {$in: individuals}}, {'groups.id': {$in: groups}}])
})

ShareSchema.method('aggregate', function(method, parent) {
  var leaf = parent.leaf
  var model = parent.model
  var prop = parent.property

  if(leaf)
    model = model.object.find(leaf)

  // XXX For now if we don't find anything
  // fail silently
  if(! model || ! model.selfLink)
    return false

  model.selfLink(prop)
    .context(this.contextIds)
    [method](this)

  return true
})

function createInstancesForContext(share, id, cb) {
  var selfLink = share.selfLink('instances').context(id)

  function isNew(student) {
    return ! selfLink.hasActor(student.id)
  }

  share.getMembers(id).exec(function(err, students) {
    async.each(students.filter(isNew), function(student, instCb) {
      share.createInstance({context:id, user: student}).save(instCb)
    }, cb)
  })
}

ShareSchema.method('createInstances', function(cb) {
  var self = this
  async.each(self.contextIds, function(id, ctxCb) {
    // Dont create instances for public
    if(id === 'public') return ctxCb()

    createInstancesForContext(self, id, ctxCb)
  }, cb)
})

/**
 * Config
 */

// Text search index
ShareSchema.index({
  'displayName': 'text',
  'description': 'text',
  'actor.displayName': 'text',
  '_object.content': 'text',
  '_object.displayName': 'text',
  'tags.displayName': 'text',
  'tags.content': 'text',
  'tags.tagType': 'text',
  'tags.meta': 'text',
  'tags.tags': 'text',
  '_object.attachments.content': 'text',
  '_object.attachments.displayName': 'text',
  '_object.attachments.objectType': 'text',
  '_object.attachments.attachments.content': 'text',
  '_object.attachments.attachments.displayName': 'text',
  '_object.attachments.attachments.attachments.content': 'text',
  '_object.attachments.attachments.attachments.displayName': 'text',
  'contexts.allow.displayName': 'text',
  '_parent.displayName': 'text',
  '_root.displayName': 'text',
  shareType: -1
}, {
  name: 'ShareTextIndex',
  weights: {
    'displayName': 10,
    'tags.displayName': 10,
    'tags.tags': 10,
    'contexts.allow.displayName': 10
  }
})

ShareSchema.index({
  channels: 1,
  'actor.id': 1,
  publishedAt: -1,
  likersLength: -1,
  fork: 1
})

ShareSchema.index({
  published: 1,
  'contexts.descriptor.id': 1
}, {
  name: 'contextIndex'
})

var Share = module.exports = ShareSchema.Model = mongoose.model('Share', ShareSchema)
var ShareInstance = Share.ShareInstance = Share.discriminator('shareInstance', ShareSchema.ShareInstance)
