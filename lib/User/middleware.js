var middleware = module.exports;
var User = require('./model');

middleware.me = function(req, res, next) {
  if(! req.auth) return next('me middleware requires req.auth');
  User.findById(req.auth.id, function(err, user) {
    if(err) return next(err);
    // This should probably not be possible, but just in case
    if(! user) return res.send(404);
    req.me = user;
    next();
  });
};

/*
  Policy middleware that restricts access to users of a certain type
 */
middleware.is = function(type) {
  return function(req, res, next) {
    if(! req.auth) return next('is middleware requires req.auth');
    if(req.auth.role !== type)
      return res.send(403);
    next();
  };
};