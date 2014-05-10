var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Types = mongoose.Types;

var ArrayType = Schema.Types.Array;
var MongooseDocumentArray = Types.DocumentArray;
var Subdocument = Types.Embedded;
var DocumentArray = Schema.Types.DocumentArray;

var ensurePlugin = require('lib/ensure-plugin');
ensurePlugin(require('lib/schema-plugin-extend'));

var _ = require('lodash');

Schema.prototype.discriminator = function(key, subSchema, options) {
  subSchema = this.extend(subSchema, options, {discriminator: true});
  this.discriminators = this.discriminators || {};
  this.discriminators[key] = subSchema;
  return subSchema;
};


function EmbeddedDocFactory(schema, options) {
  // compile an embedded document for this schema
  function EmbeddedDocument () {
    Subdocument.apply(this, arguments);
  }

  EmbeddedDocument.prototype.__proto__ = Subdocument.prototype;
  EmbeddedDocument.prototype.$__setSchema(schema);
  EmbeddedDocument.schema = schema;

  // apply methods
  for (var i in schema.methods) {
    EmbeddedDocument.prototype[i] = schema.methods[i];
  }

  // apply statics
  for (var i in schema.statics)
    EmbeddedDocument[i] = schema.statics[i];

  EmbeddedDocument.options = options;
  return EmbeddedDocument;
}


function DiscriminatorDocumentArray(key, schema, options) {

  var embeddedDocs = {};
  var rootSchema = EmbeddedDocFactory(schema, options);
  function getEmbedded(type) {
    if (type && embeddedDocs[type]) {
      return embeddedDocs[type];
    } else if (type && schema.discriminators[type]) {
      var doc = embeddedDocs[type] = EmbeddedDocFactory(schema.discriminators[type], options);
      return doc;
    } else 
      return rootSchema;
  }

  
  ArrayType.call(this, key, function(obj, parentArr, skipId, fields) {
    var discriminatorKey = schema.options.discriminatorKey;
    var thisSchema = getEmbedded(obj && obj[discriminatorKey]);
    return new thisSchema(obj, parentArr, skipId, fields);
  }, options);

  this.schema = schema;
  var path = this.path;
  var fn = this.defaultValue;

  this.default(function(){
    var arr = fn.call(this);
    if (!Array.isArray(arr)) arr = [arr];
    return new MongooseDocumentArray(arr, path, this);
  });
}

DiscriminatorDocumentArray.prototype.__proto__ = DocumentArray.prototype;

DiscriminatorDocumentArray.prototype.cast = function (value, doc, init, prev) {
  var selected
    , subdoc
    , i

  if (!Array.isArray(value)) {
    return this.cast([value], doc, init, prev);
  }

  if (!(value instanceof MongooseDocumentArray)) {
    value = new MongooseDocumentArray(value, this.path, doc);
  }

  i = value.length;

  

  while (i--) {
    if (!(value[i] instanceof Subdocument) && value[i]) {
      if (init) {
        selected || (selected = scopePaths(this, doc.$__.selected, init));
        
        var minimalVal = null;
        if (this.schema.options.discriminatorKey) {
          minimalVal = _.pick(value[i], this.schema.options.discriminatorKey);
        };
        subdoc = new this.casterConstructor(minimalVal, value, true, selected);
        value[i] = subdoc.init(value[i]);
      } else {
        if (prev && (subdoc = prev.id(value[i]._id))) {
          // handle resetting doc with existing id but differing data
          // doc.array = [{ doc: 'val' }]
          subdoc.set(value[i]);
        } else {
          subdoc = new this.casterConstructor(value[i], value);
        }

        // if set() is hooked it will have no return value
        // see gh-746
        value[i] = subdoc;
      }
    }
  }

  return value;
}

function scopePaths (array, fields, init) {
  if (!(init && fields)) return undefined;

  var path = array.path + '.'
    , keys = Object.keys(fields)
    , i = keys.length
    , selected = {}
    , hasKeys
    , key

  while (i--) {
    key = keys[i];
    if (0 === key.indexOf(path)) {
      hasKeys || (hasKeys = true);
      selected[key.substring(path.length)] = fields[key];
    }
  }

  return hasKeys && selected || undefined;
}


Schema.Types.DocumentArray = DiscriminatorDocumentArray;

module.exports = function(Schema) {};




