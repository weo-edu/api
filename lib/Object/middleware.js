var middleware = module.exports;
var url = require('url');
var Share = require('lib/Share').model;

middleware.share = function(req, res, next) {
  var objectId = req.param('id');
  var shareId = objectId.split('.')[0];
  objectId = objectId.split('.')[1];
  Share.findById(shareId, function(err, share) {
    if (err) return next(err);
    req.share = share;
    req.object = share.objectById(objectId);
    next();
  });
}

middleware.toShare = function(req, res, next) {
  // get the type from the url
  req.body.objectType = req.body.objectType || url.parse(req.originalUrl).pathname.split('/')[1];
  req.body = {_object: [req.body]};
  next();
}