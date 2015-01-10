var Schema = require('mongoose').Schema;
var selfLink = require('lib/schema-plugin-selflink');
var access = require('lib/access');
var qs = require('querystring');
var validations = require('lib/validations');

var GroupSchema = new Schema({
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
    return '/share?' + qs.stringify({channel: this.getChannel('board')});
  })
}, {discriminatorKey: 'groupType'});

GroupSchema.path('displayName').validate(validations.maxLength(20), 'Limited to 20 characters', 'maxLength');

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
    key.code = this.code;
    if(this.parent) {
      key.parent = this.parent.toJSON();
    }

    return key;
  }
});

GroupSchema.method('isOwner', function(id) {
  return this.owners.some(function(owner) {
    return owner.id === id;
  });
});

GroupSchema.foreignKey.add({
  status: String,
  code: String
});

// delete required fields, becuase classes dont have parents
// XXX pretty darn ugly
var embeddable = GroupSchema.foreignKey.embed();
['id', 'url', 'displayName'].forEach(function(name) {
  delete embeddable[name].required;
});

var SubgroupSchema = new Schema({
  parent: GroupSchema.foreignKey.embed()
}, {discriminatorKey: 'groupType', id: true, _id: true});


GroupSchema.plugin(selfLink);

GroupSchema.foreignKey.add({
  parent: embeddable
});

GroupSchema.static('path', function(group, property) {
  return 'group!' + group.id + '.' + property;
});

module.exports = {
  GroupSchema: GroupSchema,
  SubgroupSchema: SubgroupSchema
};