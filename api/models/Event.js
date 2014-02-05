/**
 * Event
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var anchor = require('anchor');
function anchorify(attrs) {
  var validations = {};
  for(var attr in attrs) {
    var validation = validations[attr] = {};
    var attrsVal = attrs[attr];

    if(typeof attrsVal === 'string')
      attrsVal = {type: attrsVal};

    for(var prop in attrsVal) {
      if(/^(defaultsTo|primaryKey|autoIncrement|unique|index|columnName)$/.test(prop)) continue;

      // use the Anchor `in` method for enums
      if(prop === 'enum') {
        validation['in'] = attrsVal[prop];
      }
      else {
        validation[prop] = attrsVal[prop];
      }
    }
  }
  return validations;
}

var anchorSchema = require('anchor-schema')
  , entitySchema = anchorSchema({
      id: {required: true, type: 'string'},
      name: {required: true, type: 'string'},
      url: {required: true, type: 'string'},
      avatar: 'string'
  });
var entitySchema =
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
      type: 'entity'
    },
    verb: {
      type: 'string',
      required: true
    },
    object: 'entity',
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
