var mongoose = require('mongoose');
var GroupSchema = require('./schema')(mongoose.Schema);
var hashid = require('lib/hashid');
var Seq = require('seq');

/*
  Hooks
 */

// Generate a hash code when a new group is created
GroupSchema.pre('validate', function(next) {
  var self = this;
  // The ! this.code check is primarily there to allow our tests
  // to send specially crafted codes.  However, it shouldn't be a
  // problem if someone wants to specify their code, as long as its
  // unique
  if(this.isNew && ! this.code) {
    hashid('Group', {offset: hashid.sixDigitOffset}, function(err, code) {
      if(err) throw err;
      self.code = code;
      next();
    });
  } else
    next();
});

GroupSchema.pre('save', function(next) {
  var self = this;
  var User = mongoose.model('User');
  if(this.isModified('owners')) {
    User.find({_id: this.owners}, function(err, users) {
      Seq(users)
        .parEach(function(user) {
          user.joinGroup(self.id);
          user.save(this);
        })
        .seq(function() {
          next();
        })
        ['catch'](function(err) {
          next(err);
        });
    });
  } else
    next();
});

GroupSchema.post('remove', function(doc) {
  // When a group is removed, take it out of everyone's group lists
  User.leaveGroup(null, doc._id, function(err) {
    if(err) throw err;
  });
});

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

