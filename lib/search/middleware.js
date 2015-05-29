

exports.shareOptions = function(options) {
  return function(req, res, next) {
    req.shareOptions = options;
    next();
  };
};

exports.contextPublic = function(req, res, next) {
  req.params['context'] = 'public';
  next();
}
