var async = require('async');
var debug = require('debug')('weo:queue');

module.exports = function(name, concurrency) {
  return async.queue(function(task, cb) {
    task(function(err) {
      err && debug('queue:' + name, err);
      cb.apply(this, arguments);
    });
  }, concurrency || 1);
};