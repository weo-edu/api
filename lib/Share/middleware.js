var Share = require('./model');

// Ensure that the user making the requet is the author
// of the share
exports.isActor = function(req, res, next) {
  if(! req.auth)
    return next('isActor requires req.auth');
  if(! req.share)
    return next('isActor requires req.share');
  if(req.share.actor.id !== req.auth.id)
    return res.send(403);
  next();
};

// Policy that ensures the share being manipulated is
// not active
exports.isNotActive = function(req, res, next) {
  if(! req.share)
    return next('isNotActive requires req.share');
  if(req.share.status === 'active')
    return res.send(403);
  next();
};

// If no actor is set the authenticated user will be
// added as the actor
exports.authActor = function(req, res, next) {
  var share = req.body;
  if (share.actor && share.actor.id) return next();
  share.actor = {
    id: req.me.id,
    name: req.me.name,
    url: req.me.url,
    avatar: req.me.avatar
  };
  next();
};