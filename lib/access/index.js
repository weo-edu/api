var access = exports;
var foreignKey = require('lib/schema-plugin-foreign-key');
var Schema = require('mongoose').Schema;
var _ = require('lodash');


/**
 * Share access helpers
 *
 * Types: "public", "group", "user"
 * Roles: "teacher", "student"
 * Id: userId or groupId
 */

access.entry = function(type, role, key) {
  key = _.clone(key || {}, true);
  key.id = access.encode(type, role, key.id);
  return key;
};

access.decode = function(entry) {
  var split = entry.split(':');
  return {
    type: split[0],
    role: split[1],
    id: split[2]
  };
};

access.encode = function(type, role, id) {
  return [type, role, id].filter(Boolean).join(':');
};


/**
 * The AllowSchema is a special version of a foreignKey
 * in that the id is not a real object id, but a composite
 * token string.  So we clone (.embed()) the abstractKey schema
 * and replace its definition of .id with our own
 */
var AllowSchema = new Schema(foreignKey.abstractKey.embed(), {_id: false, id: false});
AllowSchema.add({
  id: {
    type: String,
    required: true,
    validate: [
      function(entry) {
        entry = access.decode(entry);
        // type and role are required, id is only required
        // if type is not equal to 'public'
        return entry.type && entry.role && (entry.id || entry.type === 'public');
      }
      , 'Invalid access in allow'
    ]
  },
  displayName: {
    type: String,
    required: false
  },
  url: {
    type: String,
    required: false
  }
});

access.AllowSchema = AllowSchema;

/**
 * [AddressSchema description]
 * @type {Schema}
 */

var AddressSchema = new Schema({
  descriptor: foreignKey.abstractKey.embed(),
  allow: [AllowSchema],
  deny: String
}, {_id: false, id: false});

AddressSchema.method('tokens', function() {
  var deny = this.deny;
  return this.allow.map(function(allow) {
    return allow.id;
  }).filter(function(token) {
    return ! deny || access.decode(token).role !== deny;
  });
});

AddressSchema.method('grant', function(type, role, model) {
  model = model || {};
  model = model.toKey ? model.toKey() : model;
  this.allow.push(access.entry(type, role, model));
});

access.AddressSchema = AddressSchema;
