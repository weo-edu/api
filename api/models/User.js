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
  types: {
    password_confirmation: function(password_confirmation) {
      return password_confirmation === this.password;
    },
    password: function(password) {
      return password === this.password_confirmation;
    }
  },
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
      minLength: 5
    },
    password: {
      type: 'string',
      required: true,
      password:true
    },
    password_confirmation: {
      type: 'string',
      password_confirmation: true
    },
    tokens: 'array',
    salt: 'string',
    verifier: 'string',
    type: {
      type: 'string',
      in: ['student', 'teacher', 'parent']
    },
    groups: 'array'
  },
  beforeCreate: function(attrs, next) {
    delete attrs.password_confirmation;
    attrs.password = passwordHash.generate(attrs.password, 
      sails.config.hash);
    next();
  },
  afterCreate: function(attrs, next) {
    delete attrs.password;
    next();
  }
};
