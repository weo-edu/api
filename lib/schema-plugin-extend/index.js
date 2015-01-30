var mongoose  = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('lodash');

function merge (to, from, stack) {
  var keys = Object.keys(from)
    , i = keys.length
    , key;

  stack = stack || [];
  stack.push(from);

  function isCycle(to) {
    return stack.some(function(p) { return p === to; });
  }

  while (i--) {
    key = keys[i];

    if ('undefined' === typeof to[key]) {
      to[key] = from[key];
    } else if (_.isObject(from[key]) && ! isCycle(from[key])) {
      merge(to[key], from[key], stack);
    }
  }

  stack.pop();
}

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

  // Avoid merging the callQueue, because merge will not
  // handle it correctly
  this.callQueue = baseSchema.callQueue.slice(0);
  merge(this, baseSchema);

  this._requiredpaths = undefined; // reset just in case Schema#requiredPaths() was called on either schema
};


ExtendableSchema.prototype.embed = function() {
  return _.clone(this.schema);
};

_.extend(ExtendableSchema, Schema);

mongoose.Schema = ExtendableSchema;
module.exports = function() {};