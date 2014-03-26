var modelHook = require('../../lib/modelHook')
  , Seq = require('seq');

/**
 * User
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var passwordHash = require('password-hash');

module.exports = {
  tableName: 'user',
  attributes: {
    first_name: {
      required: true,
      type: 'string'
    },
    last_name: {
      required: true,
      type: 'string'
    },
    username: {
      type: 'string',
      required: true,
      minLength: 3,
      unique: true
    },
    password: {
      type: 'string',
      required: true,
      minLength: 6,
    },
    email: {
      type: 'email'
    },
    tokens: 'array',
    salt: 'string',
    verifier: 'string',
    type: {
      type: 'string',
      required: true,
      in: ['student', 'teacher', 'parent', 'admin']
    },
    groups: 'array'
  },
  // Event-callbacks here must use array style
  // so that they can be _.merge'd with Teacher/Student
  beforeValidation: [function(values, next) {
    if (values.full_name) {
      var fullName = values.full_name;
      values.first_name = fullName.split(' ')[0];
      values.last_name = fullName.split(' ').slice(1).join(' ');
    }
    next();
  }],
  beforeCreate: [function(attrs, next) {
    delete attrs.password_confirmation;
    attrs.password = passwordHash.generate(attrs.password,
      sails.config.hash);
    next();
  }],
  afterCreate: [function(attrs, next) {
    delete attrs.password;
    modelHook.emit('user:create', attrs, next);
  }, function(attrs, next) {
    var groups = attrs.groups;
    if (groups && groups.length) {
      Seq(groups)
        .parEach(function(group) {
          modelHook.emit('group:addMember', {groupId: group, user: attrs}, this);
        })
        .seq(function() {
          next();
        })
        .catch(function(err) {
          next(err);
        });
    } else {
      next();
    }
  }],
  addToGroup: function(userId, groupId, cb) {
    User.update(userId, {
      $addToSet: {
        groups: groupId
      }
    }).done(function(err, users) {
      if(! err && ! users.length)
        err = new databaseError.NotFound('Assignment');
      if(! err) {
        modelHook.emit('group:addMember', {groupId: groupId, user: users[0]}, function(err) {
          if (err) console.error('Error in group:addMember hook:' + err.message);
          cb(err, users[0]);
        });
      } else
        cb(err);
    });
  },
  groups: function(userId, type, cb) {
    User.findOne(userId).done(function(err, user) {
      if (err) return cb(err);
      if (!user) {
        return cb(new databaseError.NotFound('User'));
      }
      var options = {id: user.groups};
      if (type) options.type = type;
      Group.find(options).done(cb);
    });
  }
};
