var debug = require('debug')('weo:errors')
var analytics = require('lib/analytics')
var uuid = require('node-uuid')

module.exports = function(opts) {
  opts = opts || {};
  return function(err, req, res, next) {
    var track = (req.auth && req.auth.id) ?
      {userId: req.auth.id} :
      {anonymousId: uuid.v1()}
    track.event = 'Server Error'
    track.properties = {
      path: req.path,
      name: err.name,
      stack: err.stack
    }
    analytics.track(track)
    debug('%s: ', err.name, req.path, '|', err);
    opts.stack && debug(err.stack);
    next(err);
  };
};
