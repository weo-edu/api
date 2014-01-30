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
    username: {
      email: true
    },
    email: {
      type: 'string',
      email: true
    },
    title: {
      type: 'string',
      required: true,
      in: ['Mrs.', 'Ms.', 'Mr.', 'Dr.', 'First']
    }
  }
});


