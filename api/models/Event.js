/**
 * Event
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var subSchema = require('../services/subSchema.js');

module.exports = {
  types: {
    entity: subSchema({
      guid: {required: true, type: 'string'},
      name: {required: true, type: 'string'},
      url: {required: true, type: 'string'},
      avatar: 'string'
    })
  },
  attributes: {
    groups: {
      type: 'array',
      required: true
    },
    actor: {
      type: 'json',
      required: true,
      entity: true
    },
    verb: {
      type: 'string',
      required: true
    },
    object: {
      type: 'json',
      entity: true
    },
    type: {
      type: 'string',
      required: true
    },
    payload: 'json'
  },
  receivedBy: function(groupIds) {
    return Event.find({groups: groupIds});
  },
  producedBy: function(userId) {
    return Event.find({'actor.guid': userId});
  }
};