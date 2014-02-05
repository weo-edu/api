/**
 * Event
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var anchorSchema = require('anchor-schema')
  , entitySchema = anchorSchema({
      id: {required: true, type: 'string'},
      name: {required: true, type: 'string'},
      url: {required: true, type: 'string'},
      avatar: 'string'
  });

module.exports = {
  types: {
    entity: function(entity) {
      return entitySchema.$validate(entity);
    }
  },
  attributes: {
    group_id: {
      type: 'string',
      required: true
    },
    actor: {
      type: 'json',
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
    payload: 'object',
    created_at: {
      type: 'integer',
      required: true
    }
  }
};
