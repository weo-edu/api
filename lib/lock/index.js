var lock = require('redis-lock')(require('lib/redis').default);
module.exports = lock;
module.exports.middleware = function(name) {
  return function(req, res, next) {
    var key;
    if('string' === typeof name) {
      key = req.param(name);
      if(! key) return next('lock middleware requires parameter ' + name);
    } else
       key = name(req, res);

    lock(key, 2000, function(done) {
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