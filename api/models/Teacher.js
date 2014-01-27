/**
 * Teacher
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var _ = require('lodash')
  , User = require('./User.js');

module.exports = _.merge({}, User, {
  attributes: {
    type: {
      defaultsTo: 'teacher',
      in: ['teacher'],
      required: true
    },
    email: {
      type: 'email',
      required: true
    }
    /* e.g.
    nickname: 'string'
    */
  },
  beforeValidation: [function(values, next) {
    if (!values.id) {
      values.username = values.email;
    }
    next();
  }]
}, function(a, b) {
  return _.isArray(a) ? a.concat(b) : undefined;
});
