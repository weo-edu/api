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
    },
    email: {
      required: true,
      type: 'string',
      email: true
    }
  },
  beforeValidation: [function(values, next) {
    if (!values.id) {
      values.email = values.username;
    }
    next();
  }]
}, function(a, b) {
  return _.isArray(a) ? a.concat(b) : undefined;
});
