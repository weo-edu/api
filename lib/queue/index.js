var async = require('async');
var debug = require('debug')('weo:queue');

module.exports = function(name, handler, concurrency) {
  return async.queue(function(task, cb) {
    if(handler) handler(task, done);
    else task(done);

    function done(err) {
      err && debug('queue:' + name, err);
      cb.apply(this, arguments);
    }
  }, concurrency || 1);
};