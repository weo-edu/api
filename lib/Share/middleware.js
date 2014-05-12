var Share = require('./model');
var _ = require('lodash');
var errors = require('lib/errors');
var access = require('lib/access');
var utils = require('lib/utils');

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
  if(! req.me) return next('authActor requires req.me');
  var share = req.body;
  if (! share.actor || !share.actor.id)
    share.actor = req.me.toActor();
  share.actor = req.me.toActor();
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
};


/**
 * Remove the raw content field from client-side updates/creates
 * because the client is not allowed to directly specify this
 * field
 */
exports.deleteContent = function(req, res, next) {
  if(req.body && req.body.object) {
    delete req.body.object.content;
  }

  next();
};

exports.isActor = function(Model) {
  var name = utils.uncapitalize(Model.modelName);
  return function(req, res, next) {
    if(! req.auth) return next('isActor requires req.auth');
    if(! req[name]) return next('isActor requires req.' + name);
    if(req[name].actor.id.toString() !== req.auth.id.toString())
      return next(errors.Authorization('You do not have access to that share'));
    next();
  };
};