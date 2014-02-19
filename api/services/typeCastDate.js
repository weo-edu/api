/**
 * Module dependencies
 */

var pathToLib = '../../node_modules/sails/node_modules/waterline/lib/waterline';

var types = require(pathToLib + '/utils/types'),
    utils = require(pathToLib + '/utils/helpers'),
    _ = require('lodash');


/**
 * ignore
 */

utils.object = {};

/**
 * Safer helper for hasOwnProperty checks
 *
 * @param {Object} obj
 * @param {String} prop
 * @return {Boolean}
 * @api public
 */

var hop = Object.prototype.hasOwnProperty;
utils.object.hasOwnProperty = function(obj, prop) {
  return hop.call(obj, prop);
};

/**
 * Check if an ID resembles a Mongo BSON ID.
 * Can't use the `hop` helper above because BSON ID's will have their own hasOwnProperty value.
 *
 * @param {String} id
 * @return {Boolean}
 * @api public
 */

utils.matchMongoId = function matchMongoId(id) {
  if(typeof id.toString === 'undefined') return false;
  return id.toString().match(/^[a-fA-F0-9]{24}$/) ? true : false;
};

var hasOwnProperty = utils.object.hasOwnProperty;

var Cast = require(pathToLib + '/core/typecast.js');

/**
 * Converts a set of values into the proper types
 * based on the Collection's schema.
 *
 * @param {Object} values
 * @return {Object}
 * @api public
 */

Cast.prototype.run = function(values) {
  var self = this;

  Object.keys(values).forEach(function(key) {

    // Set undefined to null
    if(_.isUndefined(values[key])) values[key] = null;
    if(!hasOwnProperty(self._types, key) || values[key] === null || !hasOwnProperty(values, key)) {
      return;
    }

    // Find the value's type
    var type = self._types[key];

    // Casting Function
    switch(type) {
      case 'string':
      case 'text':
        values[key] = self.string(values[key]);
        break;

      case 'integer':
        values[key] = self.integer(key, values[key]);
        break;

      case 'float':
        values[key] = self.float(values[key]);
        break;

      case 'date':
      case 'time':
      case 'datetime':
        values[key] = self.date(values[key]);
        break;

      case 'boolean':
        values[key] = self.boolean(values[key]);
        break;

      case 'array':
        values[key] = self.array(values[key]);
        break;
    }
  });

  return values;
};

/**
 * Cast String Values
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

Cast.prototype.string = function string(str) {
  return typeof str.toString !== 'undefined' ? str.toString() : '' + str;
};

/**
 * Cast Integer Values
 *
 * @param {String} key
 * @param {Integer} value
 * @return {Integer}
 * @api private
 */

Cast.prototype.integer = function integer(key, value) {
  var _value;

  // Attempt to see if the value is resembles a MongoID
  // if so let's not try and cast it and instead return a string representation of
  // it. Needed for sails-mongo.
  if(utils.matchMongoId(value)) return value.toString();

  // Attempt to parseInt
  try {
    _value = parseInt(value, 10);
  } catch(e) {
    return value;
  }

  return _value;
};

/**
 * Cast Float Values
 *
 * @param {Float} value
 * @return {Float}
 * @api private
 */

Cast.prototype.float = function float(value) {
  var _value;

  try {
    _value = parseFloat(value);
  } catch(e) {
    return value;
  }

  return _value;
};

/**
 * Cast Boolean Values
 *
 * @param {Boolean} value
 * @return {Boolean}
 * @api private
 */

Cast.prototype.boolean = function boolean(value) {
  var parsed;

  if(_.isString(value)) {
    if(value === "true") return true;
    if(value === "false") return false;
    return false;
  }

  // Nicely cast [0, 1] to true and false
  try {
    parsed = parseInt(value, 10);
  } catch(e) {
    return false;
  }

  if(parsed === 0) return false;
  if(parsed === 1) return true;

  if(value === true || value === false) return value;

  return false;
};

/**
 * Cast Date Values
 *
 * @param {String|Date} value
 * @return {Date}
 * @api private
 */

Cast.prototype.date = function date(value) {
  var _value = new Date(Date.parse(value));
  if(_value.toString() === 'Invalid Date') return value;
  return _value;
};

/**
 * Cast Array Values
 *
 * @param {Array|String} value
 * @return {Array}
 * @api private
 */

Cast.prototype.array = function array(value) {
  if(Array.isArray(value)) return value;
  return [value];
};