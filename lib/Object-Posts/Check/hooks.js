var hooks = module.exports;

hooks.fill = function() {
  return function(check, next) {
    Share.findById(check.target.id, function(err, target) {
      if (err) return next(err);
      check.fill(target);
      next();
    });
  };
};