var access = exports;
var _ = require('lodash');

/**
 * add helpers
 */

_.extend(access, require('./helpers'));

var foreignKey = require('lib/schema-plugin-foreign-key');
var Schema = require('mongoose').Schema;





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
var descriptorSchema = foreignKey.abstractKey.embed();
// Dont validate object id's because not all our contexts
// are standard-form object ids
descriptorSchema.id = {
  type: String,
  required: true
};

var AddressSchema = new Schema({
  descriptor: descriptorSchema,
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
  model = model.toAbstractKey ? model.toAbstractKey() : model;

  var entry = access.entry(type, role, model);
  if(! this.hasAllow(entry))
    this.allow.push(entry);

  return this;
});

AddressSchema.method('hasAllow', function(entry) {
  return this.allow.some(function(allow) {
    return allow.id === entry.id;
  });
});

access.AddressSchema = AddressSchema;