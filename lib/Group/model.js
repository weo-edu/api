var mongoose = require('mongoose');
var GroupSchema = require('./schema')(mongoose.Schema);

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

GroupSchema.path('name').validate(function(value, done) {
  if(this.isModified('name') || this.isModified('type') || this.isModified('owners')) {
    // Check for duplicates, but make sure that we don't match ourselves
    this.model('Group').count({_id: {$ne: this._id}, name: value, type: this.type, owners: {$in: this.owners}})
      .exec(function(err, count) {
        if(err) return done(err);
        done(! count);
      });
  } else
    done();
}, 'Group name taken');


module.exports = mongoose.model('Group', GroupSchema);