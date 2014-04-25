var validator = require('validator');

module.exports = {
  // Check whether or not a value matches a pre-defined whitelist
  whitelist: function(/* arguments */) {
    var values = Array.prototype.slice.call(arguments);
    return function(val) {
      return values.indexOf(val) !== -1;
    };
  },
  email: validator.isEmail,
  url: validator.isUrl,
  minLength: function(min) {
    return function(str) {
      return validator.isLength(str, min);
    };
  },
  maxLength: function(max) {
    return function(str) {
      return validator.isLength(str, 0, max);
    };
  },
  length: function(min, max) {
    return function(str) {
      return validator.isLength(str, min, max);
    };
  }
};