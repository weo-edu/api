var debug = require('debug')('weo:errors');

module.exports = function(opts) {
  opts = opts || {};
  var filter = opts.filter && [].concat(opts.filter);
  return function(err, req, res, next) {
    if(!filter || filter.indexOf(err.name) !== -1) {
      debug('%s: ', err.name, err);
      opts.stack && debug(err.stack);
    }
    next(err);
  };
};