var hashid = require('lib/hashid');
var mongoose = require('mongoose');
var Share = require('lib/Share').model;
var Seq = require('seq');
var access = require('lib/access');

exports.addAccessCode = function() {
  return function(group, next) {
    // The ! this.code check is primarily there to allow our tests
    // to send specially crafted codes.  However, it shouldn't be a
    // problem if someone wants to specify their code, as long as its
    // unique
    if(group.isNew && ! group.code) {
      hashid('Group', {offset: hashid.sixDigitOffset}, function(err, code) {
        if(err) return next(err);
        group.code = code;
        next();
      });
    } else
      next();
  };
};

exports.inductOwners = function() {
  return function(group, next) {
    mongoose.model('User').find({_id: group.owners}, function(err, users) {
      Seq(users)
        .parEach(function(user) {
          user.joinGroup(group.id);
          user.save(this);
        })
        .seq(function() {
          next();
        })
        ['catch'](function(err) {
          next(err);
        });
    });
  };
};

exports.dismissMembers = function() {
  return function(group, next) {
    // When a group is removed, take it out of everyone's group lists
    mongoose.model('User').leaveGroup(null, group._id, function(err) {
      next(err);
    });
  };
};

var weoUser = require('lib/weo-user');
exports.groupCodeTip = function() {
  return function(group, next) {
    weoUser(function(err, user) {
      if(err) return next(err);
      var share = new Share({
        verb: 'shared',
        type: 'tip',
        actor: user.toActor(),
        object: {
          code: group.code,
          name: group.name,
          type: 'code'
        }
      });

      share.allow(group.id, access.entry('group', 'teacher', group.id));
      share.save(function(err) { next(err); });
    });
  };
};