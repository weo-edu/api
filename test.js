var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var SchemaType = require('mongoose/lib/schematype');
var Subdocument = require('mongoose/lib/types/embedded');
var DocumentArray = require('mongoose/lib/schema/documentarray')
var MongooseDocumentArray = require('mongoose/lib/types/documentarray');
var ArrayType = require('mongoose/lib/schema/array');
var _ = require('lodash');

mongoose.connect('localhost');

//mongoose.plugin(function(schema) {
  Schema.prototype.discriminator = function(key, subSchema) {
    var discriminatorKey = 'type';
    subSchema = new Schema(subSchema);//, {_id: false, id: false});
    // merges base schema into new discriminator schema and sets new type field.
    (function mergeSchemas(schema, baseSchema) {
      _.merge(schema, baseSchema);

      var obj = {};
      obj[discriminatorKey] = { type: String};
      schema.add(obj);
      schema.discriminatorMapping = { key: discriminatorKey, isRoot: false };

      if (baseSchema.options.collection) {
        schema.options.collection = baseSchema.options.collection;
      }

        // throws error if options are invalid
      (function validateOptions(a, b) {
        a = _.clone(a, true);
        b = _.clone(b, true);
        delete a.toJSON;
        delete a.toObject;
        delete b.toJSON;
        delete b.toObject;

        if (!_.isEqual(a, b)) {
          throw new Error("Discriminator options are not customizable (except toJSON & toObject)");
        }
      })(schema.options, baseSchema.options);

      var toJSON = schema.options.toJSON
        , toObject = schema.options.toObject;

      schema.options = _.clone(baseSchema.options, true);
      if (toJSON)   schema.options.toJSON = toJSON;
      if (toObject) schema.options.toObject = toObject;

      schema.callQueue = baseSchema.callQueue.concat(schema.callQueue);
      schema._requiredpaths = undefined; // reset just in case Schema#requiredPaths() was called on either schema
    })(subSchema, this);

    this.discriminators = this.discriminators || {};
    this.discriminators[key] = subSchema;
    return subSchema;
  };

//   return schema;
// });
var util = require('util');
function TypeFactory(schema) {
  function SubdocFactory(schema, options) {
    // compile an embedded document for this schema
    function EmbeddedDocument (val, options) {
      console.log('this', this);
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

  function Type(key) {
    this.schema = schema;
    SchemaType.apply(this, arguments);
    _.each(schema.discriminators, function(subSchema, key) {
      schema.discriminators[key] = SubdocFactory(subSchema);
    });

    var rootSchema = SubdocFactory(schema);
    ArrayType.call(this, key, function(val) {
      var thisSchema = schema.discriminators[val && val.type] || rootSchema;
      return new thisSchema(val);
    }, schema.options);

    this.schema = schema;
    var path = this.path;
    var fn = this.defaultValue;

    this.default(function(){
      var arr = fn.call(this);
      if (!Array.isArray(arr)) arr = [arr];
      return new MongooseDocumentArray(arr, path, this);
    });

  }

  Type.prototype.__proto__ = DocumentArray.prototype;
  mongoose.Schema.Types.Type = Type;
  return Type;
};

function Oid() {
  Schema.Types.ObjectId.apply(this, arguments);
}

Oid.prototype.__proto__ = Schema.Types.ObjectId.prototype;
var oldCast = Oid.prototype.cast;
Schema.Types.Oid = Oid;
Oid.prototype.cast = function(value, doc, init) {
  var err = new Error;
  value = oldCast.apply(this, arguments);
  return value;
};

var ObjectSchema = new Schema({
  type: String,
  _id: {
    type: Oid,
    auto: true
  }
});

var ShareSchema = ObjectSchema.discriminator('share', {
  type: String,
  bar: String
});

var PostSchema = ObjectSchema.discriminator('post', {
  type: String,
  foo: String
});

PostSchema.method('foobar', function() {
  return 'foobar test';
});

schemaA = Schema({
  B: TypeFactory(ObjectSchema),
  test: String
});

// schemaA = Schema({
//   B: [PostSchema]
// });

modelA = mongoose.model('modelA', schemaA);

var model = new modelA({
  test: 'testing',
  B: [{
    type: 'post',
    foo: 'foo',
    bar: 'bar'
}]});


console.log('foobar result', model.B[0]);

console.log('new model', model);
// schemaB = Schema({test: String});
// modelB = mongoose.model('modelB', schemaB);

// model = new modelA;

// model.B = {test: 'test string'};
// model.save(console.log.bind(console, 'save'));

//modelB.find(console.log.bind(console, 'read'));