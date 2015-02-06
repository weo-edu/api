var _ = require('lodash');

module.exports = function(value) {
  if(value === undefined)
    return [];
  else if(_.isArray(value))
    return value;
  else
    return [value];
};