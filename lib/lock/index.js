var lock = require('redis-lock')(require('lib/redis').default);
module.exports = lock;
module.exports.middleware = function(name) {
  return function(req, res, next) {
    if(! req.param(name)) return next('lock middleware requirtes parameter ' + name);
    lock(req.param(name), 2000, function(done) {
      // unlock on end
      var end = res.end;
      res.end = function() {
        done();
        return end.apply(this, arguments);
      };
      next();
    });
  };
};