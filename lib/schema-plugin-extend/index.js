var mongoose  = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('lodash');

function ExtendableSchema(obj, options) {
  if(! (this instanceof ExtendableSchema))
    return new ExtendableSchema(obj, options);

  Schema.call(this, obj, options);
  this.schema = obj;
}

ExtendableSchema.prototype.__proto__ = Schema.prototype;

var add = Schema.prototype.add;
ExtendableSchema.prototype.add = function(obj) {
  var ret = add.apply(this, arguments);
  _.merge(this.schema, obj);
  return ret;
};

ExtendableSchema.prototype.extend = function(obj, options, extendOpts) {
  var schemaOpts = _.extend({}, this.options, options);
  var newSchema = new ExtendableSchema(_.merge(obj, this.schema), schemaOpts);
  newSchema.merge(this, extendOpts || {});
  newSchema.parent = this;
  return newSchema;
};

ExtendableSchema.prototype.merge = function(baseSchema, opts) {
  opts = opts || {};

  this.methods = _.extend({}, baseSchema.methods);
  this.statics = _.extend({}, baseSchema.statics);

  if (opts.discriminator) {
    var obj = {};
    var discriminatorKey = this.options.discriminatorKey;
    obj[discriminatorKey] = {type: String};
    this.add(obj);
    this.discriminatorMapping = {key: discriminatorKey, isRoot: false};

    if (baseSchema.options.collection) {
      this.options.collection = baseSchema.options.collection;
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
    })(this.options, baseSchema.options);

    var toJSON = this.options.toJSON
    , toObject = this.options.toObject;

    this.options = _.clone(baseSchema.options, true);
    if (toJSON)   this.options.toJSON = toJSON;
    if (toObject) this.options.toObject = toObject;
  }

  this.callQueue = baseSchema.callQueue.concat(this.callQueue);
  this._requiredpaths = undefined; // reset just in case Schema#requiredPaths() was called on either schema
};


ExtendableSchema.prototype.embed = function() {
  return _.clone(this.schema);
};

_.extend(ExtendableSchema, Schema);

mongoose.Schema = ExtendableSchema;
module.exports = function() {};