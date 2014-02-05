var anchorSchema = require('anchor-schema');

module.exports = function(schema) {
  var validator = anchorSchema(schema);
  return function(o) {
    return validator.$validate(o);
  };
};