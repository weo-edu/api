var _ = require('underscore');

module.exports = function(attrs) {
  return function(values, next) {
    _.each(attrs, function(val, key) {
      if(_.isObject(val) && val.type === 'virtual') {
        values[key] = val.fn.apply(values);
        if(values[key] === undefined)
          delete values[key];
      }
    });
    next();
  };
};