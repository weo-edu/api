var mongoose = require('mongoose');
var GroupSchema = require('./schema');
var access = require('lib/access');
/*
  Static methods
 */
GroupSchema.static('ownedBy', function(id) {
  return this.find({owners: id});
});

/*
  Instance methods
 */
GroupSchema.method('isOwner', function(id) {
  return this.owners.indexOf(id) !== -1;
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

GroupSchema.pre('validate', function(next) {
  if (!this.access || !this.access.allow.length) {
    this.access.allow = [access.entry('public', 'teacher'), access.entry('group', 'student', this.id)];
  }
  next();
});

var Group = module.exports = mongoose.model('Group', GroupSchema);
