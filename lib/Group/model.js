var mongoose = require('mongoose');
var GroupSchema = require('./schema');
var access = require('lib/access');
var _ = require('lodash');
var toAbstractKey = require('lib/schema-plugin-foreign-key').toAbstractKey;

/**
 * Hooks
 */
require('./hooks');

/*
  Static methods
 */
GroupSchema.static('findByCode', function(code) {
  return this.where('code', code.toLowerCase());
});

GroupSchema.static('ownedBy', function(id) {
  return this.where({'owners.id': id});
});

GroupSchema.static('subgroupsOf', function(id) {
  return this.where('parent.id', id);
});

GroupSchema.static('activeOf', function(user) {
  return this.where({_id: _.pluck(_.where(user.groups, {status: 'active'}), 'id')});
});

/*
  Instance methods
 */

GroupSchema.method('subgroups', function() {
  return Group.subgroupsOf(this.id);
});

GroupSchema.method('archive', function() {
  this.status = 'archived';
  return this;
});

GroupSchema.virtual('ownerIds').get(function() {
  return this.owners.map(function(owner) {
    return owner.id;
  });
});


/*
  Various config / extra server-side-only validation
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
      if(err) return done(err);
      done(! count);
    });
  } else
    done();
}, 'Group name taken', 'unique');


GroupSchema.static('defaultAllow', function(groupKey) {
  groupKey = groupKey.toKey ? groupKey.toKey() : groupKey;
  groupKey = toAbstractKey(groupKey);
  return [
    access.entry('group', 'teacher', groupKey),
    access.entry('group', 'student', groupKey)
  ];
});

var Group = module.exports = mongoose.model('Group', GroupSchema);
Group.discriminator('group', GroupSchema.SubgroupSchema);