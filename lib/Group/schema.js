var Schema = require('mongoose').Schema;
var selfLink = require('lib/schema-plugin-selflink');
var access = require('lib/access');
var qs = require('querystring');
var _ = require('lodash');

var GroupSchema = module.exports = new Schema({
  groupType: {
    type: String,
    default: 'class',
    enum: ['class', 'group']
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
    return '/share?' + qs.stringify({channel: this.path('board')});
  })
}, {discriminatorKey: 'groupType'});

var UserSchema = require('lib/User/schema');
GroupSchema.add({
  owners: {
    type: [UserSchema.foreignKey],
    required: true
  }
});

GroupSchema.plugin(require('lib/schema-plugin-foreign-key'), {
  model: 'Group',
  transform: function(key) {
    key.status = this.status;
    if(this.parent) {
      key.parent = this.parent.toJSON();
    }

    return key;
  }
});

GroupSchema.foreignKey.add({
  status: String
});

// delete required fields, becuase classes dont have parents
// XXX pretty darn ugly
var embeddable = GroupSchema.foreignKey.embed();
_.each(['id', 'url', 'displayName'], function(name) {
  delete embeddable[name].required;
})


GroupSchema.SubgroupSchema = new Schema({
  parent: GroupSchema.foreignKey.embed()
}, {discriminatorKey: 'groupType', id: true, _id: true});

GroupSchema.foreignKey.add({
  parent: embeddable
});

GroupSchema.plugin(selfLink);

GroupSchema.static('path', function(group, property) {
  return 'group!' + group.id + '.' + property;
});
