/**
 * Student
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var _ = require('lodash')
  , User = require('./User.js');

module.exports = _.merge(_.clone(User, true), {
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
      password_confirmation: true
    },
    grade: {
      type: 'integer',
      in: _.range(13)
    },
    password: {
      password: true
    }
  	/* e.g.
  	nickname: 'string'
  	*/
  },
  // Event-callbacks here must use array style
  // so that they can be _.merge'd with User
  beforeCreate: [
    function(attrs, next) {
      delete attrs.password_confirmation;
      next();
    }
  ]
});
