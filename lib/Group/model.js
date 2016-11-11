/**
 * Imports
 */

var mongoose = require('mongoose')
var GroupSchema = require('./schema')
var access = require('lib/access')
var _ = require('lodash')
var toAbstractKey = require('lib/schema-plugin-foreign-key').toAbstractKey
var Following = require('lib/following')

/**
 * Vars
 */

var followers = Following.followers

/**
 * Hooks
 */

require('./hooks')

/*
  Static methods
 */

GroupSchema.static('findByCode', function(code) {
  return this.where('code', code.toLowerCase())
})

GroupSchema.static('ownedBy', function(id) {
  return this.where({'owners.id': id})
})

GroupSchema.static('activities', function (id) {
  return mongoose.model('Share')
    .find()
    .where('channels', Group.path(id, 'board'))
})

GroupSchema.static('activeOf', function(user) {
  return this.where({_id: _.pluck(_.where(user.groups, {status: 'active'}), 'id')})
})

GroupSchema.static('defaultAllow', function(groupKey) {
  groupKey = groupKey.toKey ? groupKey.toKey() : groupKey
  groupKey = toAbstractKey(groupKey)
  return [
    access.entry('group', 'teacher', groupKey),
    access.entry('group', 'student', groupKey)
  ]
})

GroupSchema.static('updateFollowers', function(id) {
  return Group
    .findById(id)
    .exec()
    .then(function(group) {
      return followers(group.id)
        .then(function(edges) {
          group.followers = edges.length
          return group.save()
        })
    })
})

/*
  Instance methods
 */

GroupSchema.method('archive', function() {
  this.status = 'archived'
  return this
})

GroupSchema.method('addImageFromShare', function(share) {
  if (share.image && share.image.url) {
    this.images = [share.image].concat(this.images.slice(0, 3)).filter(Boolean)
    return true
  }
})

GroupSchema.method('members', function () {
  return mongoose
    .model('User')
    .find({'groups.id': this._id})
})

/**
 * Virtual properties
 */

GroupSchema.virtual('ownerIds').get(function() {
  return this.owners.map(function(owner) {
    return owner.id
  })
})

/**
 * Validation
 */

GroupSchema.path('displayName').validate(function(value, done) {
  if(this.isModified('displayName') || this.isModified('groupType') || this.isModified('owners')) {
    // Check for duplicates, but make sure that we don't match ourselves
    Group.count({
      _id: {$ne: this._id},
      displayName: value,
      groupType: this.groupType,
      owners: {$in: this.owners},
      status: 'active'
    }).exec(function(err, count) {
      if(err) return done(err)
      done(! count)
    })
  } else
    done()
}, 'Group name taken', 'unique')

/**
 * Indexes
 */

GroupSchema.index({
  'displayName': 'text',
  'owners.displayName': 'text',
}, {
  name: 'GroupTextIndex',
})

/**
 * Exports
 */

var Group = module.exports = mongoose.model('Group', GroupSchema)
