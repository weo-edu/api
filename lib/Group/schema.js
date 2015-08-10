var Schema = require('mongoose').Schema
var selfLink = require('lib/schema-plugin-selflink')
var access = require('lib/access')
var qs = require('querystring')
var validations = require('lib/validations')

var GroupSchema = module.exports = new Schema({
  groupType: {
    type: String,
    default: 'class',
    enum: ['class', 'board']
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'archived']
  },
  displayName: {
    type: String,
    required: true
  },
  code: {
    type: String,
    unique: true,
    required: true
  },
  access: {
    allow: [access.AllowSchema],
    deny: String
  },
  board: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.getChannel('board')})
  }),
  images: [{
    url: String,
    width: Number,
    height: Number
  }],
  followers: {
    type: Number,
    default: 0
  }
}, {discriminatorKey: 'groupType'})

GroupSchema.path('displayName').validate(validations.maxLength(20), 'Limited to 20 characters', 'maxLength')

var UserSchema = require('lib/User/schema')

GroupSchema.add({
  owners: {
    type: [UserSchema.foreignKey],
    minLength: 1
  }
})

GroupSchema.plugin(require('lib/schema-plugin-foreign-key'), {
  model: 'Group',
  transform: function(key) {
    key.status = this.status
    key.code = this.code
    key.url = '/' + this.owners[0].id + '/' + this.groupType + '/' + this.id
    key.groupType = this.groupType
    return key
  }
})

GroupSchema.method('isOwner', function(id) {
  return this.owners.some(function(owner) {
    return owner.id === id
  })
})

GroupSchema.foreignKey.add({
  status: String,
  code: String,
  groupType: String
})


GroupSchema.plugin(selfLink)

GroupSchema.static('path', function(group, property) {
  var id = group.id || group
  return 'group!' + id + '.' + property
})