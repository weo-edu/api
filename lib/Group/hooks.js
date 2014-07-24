var hashid = require('lib/hashid');
var User = require('lib/User').model;
var Seq = require('seq');
var access = require('lib/access');
var codeTip = require('lib/tips').code;
var weoUser = require('lib/weo-user');
var Share = require('lib/Share').model;
var io = require('lib/io');
var Seq = require('seq');

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
    User.find()
      .where('_id').in(group.ownerIds)
      .exec(function(err, users) {
      Seq(users)
        .parEach(function(user) {
          user.joinGroup(group);
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
    User.leaveGroup(null, group._id, function(err) {
      next(err);
    });
  };
};


exports.groupCodeTip = function() {
  return function(group, next) {
    if(group.groupType !== 'class')
      return next();

    weoUser(function(err, user) {
      if(err) return next(err);

      var share = new Share({
        verb: 'shared',
        actor: user.toKey(),
        channels: [group.path('board')],
        object: {
          objectType: 'tip',
          content: codeTip(group)
        }
      });

      share.ensureContext(group.toKey())
        .grant('group', 'teacher', group);

      share.save(function(err) {
        next(err);
      });
    });
  };
};


function joinLeaveFactory() {
  return function() {
    return function(e, next) {
      var json = e.user.toJSON();
      e.groups.forEach(function(group) {
        io.sockets
          .to(group)
          .send({
            verb: 'change',
            params: {
              group: group
            },
            model: 'User',
            data: json
          });
      });

      next();
    };
  };
}

exports.broadcastJoin = joinLeaveFactory();
exports.broadcastLeave = joinLeaveFactory();


exports.archiveSubgroups = function() {
  return function(group, next) {
    if(group.status !== 'archived')
      return next();

    group.subgroups().find(function(err, subgroups) {
      if(err) return next(err);

      Seq(subgroups)
        .parEach(function(sub) {
          sub.archive().save(this);
        })
        .seq(function() { next(); })
        .catch(next);
    });
  };
};