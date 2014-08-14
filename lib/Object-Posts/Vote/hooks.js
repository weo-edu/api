var hooks = module.exports;

hooks.fill = function() {
  return function(vote, next) {
    Share.findById(vote.target.id, function(err, target) {
      if (err) return next(err);
      vote.fill(target);
      next();
    });
  };
}