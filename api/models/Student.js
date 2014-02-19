/**
 * Student
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var mergeModels = require('../../lib/mergeModels.js')
  , User = require('./User.js')
  , _ = require('lodash');

module.exports = mergeModels(User, {
  types: {
    password_confirmation: function(password_confirmation) {
      return password_confirmation === this.password;
    },
    password: function(password) {
      return password === this.password_confirmation;
    }
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
      type: 'array',
      minLength: 1,
      required: true
    }
  }
});
