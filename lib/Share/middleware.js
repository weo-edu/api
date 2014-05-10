var Share = require('./model');
var Group = require('lib/Group').model;
var _ = require('lodash');
var errors = require('lib/errors');
var access = require('lib/access');
var async = require('async');

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
  share.actor = req.me.toActor();
  next();
};

exports.validateBoard = function(req, res, next) {
  var boards = req.param('board');
  boards = [].concat(boards);
  if (boards.length) {
    //XXX this isnt working - look into it
    req.params.board = boards;
    next()
  } else {
    next(errors.Client('Invalid to', 'to', to));
  }
};


//XXXX redo resolve
exports.resolveAccess = function(req, res, next) {
  var boards = req.param('board');
  var channel = req.param('channel');
  var to = req.param('to');
  if (boards && to) {
    return next(errors.Client('To - Board conflict', 'to', to));
  } else if (boards) {
    req.body.to = _.map([].concat(boards), function(board) {
      return { board: board}
    });
  }
  async.each(req.body.to, function(address, cb) {
    if (!address.allow) {
      Group.findById(address.board, function(err, group) {
        if (err) return cb(err);
        address.allow = group.access.allow;

        //XXX no public access for channels (a bit hacky)
        if (channel) {
          address.allow = _.map(address.allow, function(entry) {
            entry = access.decode(entry);
            if (entry.type === 'public') {
              entry.type = 'group';
              entry.id = address.board;
            }
            return access.encode(entry);
          });
        }

        cb();
      });
    } else {
      cb();
    }
    
  }, next);
}