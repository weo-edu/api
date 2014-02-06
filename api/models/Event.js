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
      id: {required: true, type: 'string'},
      name: {required: true, type: 'string'},
      url: {required: true, type: 'string'},
      avatar: 'string'
    })
  },
  attributes: {
    group_id: {
      type: 'string',
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
      required: true,
      entity: true
    },
    type: {
      type: 'string',
      required: true
    },
    payload: 'json'
  }
};