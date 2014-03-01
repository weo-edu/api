/**
 * Event
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var subSchema = require('../services/subSchema.js');

//XXX should events have an `at` param so that you can set future events

module.exports = {
  types: {
    entity: subSchema({
      id: {required: true, type: 'string'},
      name: {required: true, type: 'string'},
      link: {required: true, type: 'string'},

      // actor uses avatar, object uses icon
      avatar: 'string',
      icon: 'string'
    })
  },
  attributes: {
    to: {
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
  receivedBy: function(to) {
    return Event.find({to: to});
  },
  producedBy: function(userId) {
    return Event.find({'actor.id': userId});
  }
};