var mongoose  = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('lodash');

function merge (to, from) {
  var keys = Object.keys(from)
    , i = keys.length
    , key;

  while (i--) {
    key = keys[i];
    if ('undefined' === typeof to[key]) {
      to[key] = from[key];
    } else if (_.isObject(from[key])) {
      merge(to[key], from[key]);
    }
  }
};

function ExtendableSchema(obj, options) {
  Schema.call(this, obj, options);
  this.schema = obj;
};

ExtendableSchema.prototype.__proto__ = Schema.prototype;

ExtendableSchema.prototype.extend = function(obj, options, extendOpts) {
  extendOpts = extendOpts || {};
  var mergeObj = _.merge(obj, this.schema);
  var newSchema = new ExtendableSchema(_.merge(obj, this.schema), _.extend({}, this.options, options));
  var discriminatorKey = this.options.discriminatorKey;
  // merges base schema into new discriminator schema and sets new type field.
  (function mergeSchemas(schema, baseSchema) {
    merge(schema, baseSchema);
    if (extendOpts.discriminator) {
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
    }

    schema.callQueue = baseSchema.callQueue.concat(schema.callQueue);
    schema._requiredpaths = undefined; // reset just in case Schema#requiredPaths() was called on either schema
  })(newSchema, this);
  newSchema.parent = this;
  return newSchema;
};


ExtendableSchema.prototype.embed = function() {
  return _.clone(this.schema);
};

_.extend(ExtendableSchema, Schema);

mongoose.Schema = ExtendableSchema;


module.exports = function(Schema) {};