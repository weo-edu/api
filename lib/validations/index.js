var validator = require('validator');

module.exports = {
  email: function(email) {
    return ! email || validator.isEmail(email);
  },
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
  },
  ObjectId: function() {
    return function(str) {
      // coerce to string so the function can be generically used to test both strings and native objectIds created by the driver
      str = str + '';
      var len = str.length, valid = false;
      if (len === 12 || len === 24) {
        valid = /^[0-9a-fA-F]+$/.test(str);
      }

      return valid;
    };
  }
};