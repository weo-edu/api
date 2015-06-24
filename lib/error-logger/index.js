var debug = require('debug')('weo:errors');

module.exports = function(opts) {
  opts = opts || {};
  return function(err, req, res, next) {
    debug('%s: ', err.name, req.path, '|', err);
    opts.stack && debug(err.stack);
    next(err);
  };
};