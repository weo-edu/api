/**
 * Teacher
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var mergeModels = require('../../lib/mergeModels.js')
  , User = require('./User.js');

module.exports = mergeModels({}, User, {
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
  },
  // Event-callbacks here must use array style
  // so that they can be _.merge'd with User
  beforeValidation: [function(values, next) {
    if (! values.id) {
      values.username = values.email;
    }
    next();
  }].concat(User.beforeValidation)
});


