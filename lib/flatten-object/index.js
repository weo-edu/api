var _ = require('lodash');

module.exports = function flatten(object, prefix) {
  var obj = {};
  prefix = prefix || '';
  if (object.toJSON)
    object = object.toJSON();
  _.each(object, function(val, key) {
    if (_.isObject(val)) {
      _.extend(obj, flatten(val, prefix + key + '.'));
    } else {
      obj[prefix + key] = val;
    }
  });
  return obj;
};