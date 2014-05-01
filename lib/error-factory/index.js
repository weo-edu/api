var util = require('util');
var _ = require('lodash');

/**
 * Subclass our ApiError object to make various
 * specialized errors (e.g. NotFound)
 * @param  {String} name     Name of the error (appears in the .name property)
 * @param  {String} code     Default error code to use (will be set
 *                           on any fields that don't have an explicit code set)
 * @param  {Object} defaults Default properties to put on the error
 * @return {ApiError}        Returns a subclassed ApiError constructor
 */
module.exports = function subclass(name, code, defaults) {
  function ApiError(message, field, value) {
    // Allow it to be called as a method
    if(! (this instanceof Error))
      return new ApiError(message, field, value);

    Error.call(this);
    _.extend(this, defaults);
    this.name = name;
    this.message = message;
    field && this.error(code, field, value, message);
  };

  util.inherits(ApiError, Error);


  /**
   * Chain additional field errors onto this error
   * object
   * @param  {String} type    the code for the error (e.g. invalid, required, etc.)
   * @param  {String} path    the model path that caused the error
   * @param  {Mixed}  value   the value that caused the error
   * @param  {String} message A plain english description of the error
   * @return {ApiError}       returns 'this' so that it may be chained
   */
  ApiError.prototype.error = function(code, path, value, message) {
    this.errors = this.errors || {};
    this.errors[path] = {
      path: path,
      type: code,
      value: value,
      message: message
    };
    return this;
  };

  return ApiError;
};