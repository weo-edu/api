

exports.shareOptions = function(options) {
  return function(req, res, next) {
    req.shareOptions = options;
    next();
  };
};
