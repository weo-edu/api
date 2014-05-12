var validator = require('validator');

module.exports = {
  email: validator.isEmail,
  url: validator.isURL,
  alphanumeric: validator.isAlphanumeric,
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