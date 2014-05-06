var Share = require('./model');
var _ = require('lodash');
var errors = require('lib/errors');
var access = require('lib/access');

// Ensure that the user making the requet is the author
// of the share
exports.isActor = function(req, res, next) {
  if(! req.auth)
    return next(errors.Server('isActor requires req.auth'));
  if(! req.share)
    return next(errors.Server('isActor requires req.share'));
  if(req.share.actor.id !== req.auth.id)
    return next(errors.Authorization());
  next();
};

// Policy that ensures the share being manipulated is
// not active
exports.isNotActive = function(req, res, next) {
  if(! req.share)
    return next(errors.Server('isNotActive requires req.share'));
  if(req.share.status === 'active')
    return next(errors.Authorization());
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

exports.validateTo = function(req, res, next) {
  var to = req.param('to');
  if (_.isArray(to) ? _.all(to, _.identity) : !!to) {
    next()
  } else {
    next(errors.Client('Invalid to', 'to', to));
  }
};

exports.resolveParentTo = function(req, res, next) {
  var to = req.query['to'];
  var share = req.body;
  if (share.parent && share.parent.id) {
    var parent = share.parent.id;
    parent = parent.split(':')[0] // allows for sub namespace
    Share.findById(parent, function(err, parentShare) {
      if (err) return next(err);
      share.parent.path = parentShare.path 
        ? parentShare.path+ ':' + share.parent.id 
        : share.parent.id;

      to = to ? [].concat(to) : _.pluck(parentShare.to, 'id');
      var err;
      share.to = _.map(to, function(toId) {
        var address = _.find(parentShare.to, {id: toId});
        if (!address) {
          err = errors.Client('Invalid to', 'to', to);
          return;
        }
        address = address.toJSON();
        address.allow = _.map(address.allow, function(entry) {
          entry = access.decode(entry);
          if (entry.type === 'public') {
            entry.type = 'group';
            entry.id = address.id;
          }
          return access.encode(entry);
        });
        return address;
      });
      next(err);
    });
  } else {
    next();
  }
}