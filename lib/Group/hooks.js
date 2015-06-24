var hashid = require('lib/hashid');
var Seq = require('seq');
var Seq = require('seq');
var Schema = require('./schema');
var mongoose = require('mongoose');

/**
 * Pre/post validate
 */

Schema.pre('validate', function addAccessCode(next) {
  var group = this;

  if(group.isNew && ! group.code) {
    // The ! this.code check is primarily there to allow our tests
    // to send specially crafted codes.  However, it shouldn't be a
    // problem if someone wants to specify their code, as long as its
    // unique
    hashid('Group', function(err, code) {
      group.code = code;
      next();
    });
  } else
    next();
});

/**
 * Pre save/remove
 */

Schema.pre('save', function inductOwners(next) {
  if(! (this.isNew || this.isModified('owners')))
    return next();

  var group = this;
  mongoose.model('User').find()
    .where('_id').in(group.ownerIds)
    .exec(function(err, users) {
      Seq(users)
        .parEach(function(user) {
          user.joinGroup(group);
          user.save(this);
        })
        .seq(function() { next(); })
        .catch(next);
    });
});

/**
 * Post save/remove
 */

Schema.post('remove', function dismissMembers(group, next) {
  // When a group is removed, take it out of everyone's group lists
  User.leaveGroup(null, group._id, function(err) { next(err); });
});