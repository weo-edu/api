/**
 * Teacher
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var mergeModels = require('../../lib/mergeModels.js')
  , User = require('./User.js');

var model = module.exports = mergeModels({}, User, {
  types: {
    virtual: function() { return true; },
    fn: function() { return true; },
  },
  attributes: {
    type: {
      defaultsTo: 'teacher',
      in: ['teacher'],
      required: true
    },
    username: {
      email: true,
      unique: true
    },
    email: {
      type: 'virtual',
      fn: function() {
        return this.username;
      }
    },
    title: {
      type: 'string',
      required: true,
      in: ['Mrs.', 'Ms.', 'Mr.', 'Dr.', 'None']
    }
  }
});

model.beforeCreate.push(require('../services/virtualize.js')(model.attributes));
model.beforeUpdate = [require('../services/virtualize.js')(model.attributes)];
