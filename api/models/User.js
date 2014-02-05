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
      in: ['student', 'teacher', 'parent']
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
    next();
  }, function(attrs, next) {
    //XXX delete user on error
    Seq()
      .seq(function() {
        Group.create({type: 'individual', name: attrs.username}, this);
      })
      .seq(function(group) {
        User.addToGroup(attrs.id, group.id, this);
      })
      .seq(function(user) {
        attrs.groups = user.groups;
        next();
      })
      .catch(next);
  }],
  addToGroup: function(userId, groupId, cb) {
    User.update({id: userId}, {$addToSet: {groups: groupId}}).done(function(err, users) {
      if (err) return cb(err);
      if (users.length) {
        var user = users[0];
        cb(null, user);
      } else {
        cb(new databaseError.NotFound('Assignment'));
      }
      
    });
  }
};
