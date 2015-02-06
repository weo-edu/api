var debug = require('debug')('weo:errors');
var asArray = require('lib/as-array');

Error.stackTraceLimit = 30;
module.exports = function(opts) {
  opts = opts || {};
  var filter = asArray(opts.filter);
  return function(err, req, res, next) {
    if(filter.indexOf(err.name) !== -1) {
      debug('%s: ', err.name, req.path, '|', err);
      opts.stack && debug(err.stack);
    }
    next(err);
  };
};