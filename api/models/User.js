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
      minLength: 3
    },
    password: {
      type: 'string',
      required: true,
      password: true
    },
    email: {
      type: 'email'
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
  // Event-callbacks here must use array style
  // so that they can be _.merge'd with Teacher/Student
  beforeCreate: [function(attrs, next) {
    attrs.password = passwordHash.generate(attrs.password, 
      sails.config.hash);
    next();
  }],
  afterCreate: [function(attrs, next) {
    delete attrs.password;
    next();
  }]
};
