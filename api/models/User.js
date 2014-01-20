/**
 * User
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

var passwordHash = require('password-hash');

module.exports = {
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
      required: true
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
    attrs.password = passwordHash.generate(attrs.password, 
      sails.config.hash);
    next();
  }
};
