/**
 * Student
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var mergeModels = require('../../lib/mergeModels')
  , UserSchema = require('./User')
  , _ = require('lodash');

var model = module.exports = mergeModels(UserSchema, {
  types: {
    password_confirmation: function(password_confirmation) {
      return password_confirmation === this.password;
    },
    password: function(password) {
      return password === this.password_confirmation;
    },
    virtual: function() { return true; },
    fn: function() { return true; }
  },
  attributes: {
  	type: {
      defaultsTo: 'student',
      in: ['student']
    },
    password_confirmation: {
      type: 'string',
      password_confirmation: true,
      required: true
    },
    password: {
      password: true
    },
    groups: {
      type: 'array'
    },
    name: {
      type: 'virtual',
      fn: function() {
        return this.first_name + ' ' + this.last_name;
      }
    }
  },

  findAssignable: function(groupIds, cb) {
    User.find({groups: groupIds, type: 'student'}).done(function(err, users) {
      if (err) return cb(err);
      var students = _.filter(users, function(user) {
        return user.type === 'student';
      })
      var groups = _.map(students, function(user) {
        var group = {};
        group.name = user.name;
        group.id = user.id;
        return group;
      });
      cb(null, groups);
    });
  }
});

model.beforeCreate.push(require('../services/virtualize.js')(model.attributes));
model.beforeUpdate = [require('../services/virtualize.js')(model.attributes)];