var hooks = module.exports;
var Share = require('lib/Share').model;

hooks.fill = function() {
  return function(vote, next) {
    Share.findById(vote.share().parent.id, function(err, parent) {
      if (err) return next(err);
      vote.fill(parent);
      next();
    });
  };
};