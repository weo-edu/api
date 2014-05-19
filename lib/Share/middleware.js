var Share = require('./model');
var Group = require('lib/Group').model;
var _ = require('lodash');
var errors = require('lib/errors');
var access = require('lib/access');
var utils = require('lib/utils');
var async = require('async');

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

exports.validateBoard = function(req, res, next) {
  var boards = req.param('board');
  boards = [].concat(boards);
  if (boards.length) {
    //XXX this isnt working - look into it
    req.params.board = boards;
    next()
  } else {
    next(errors.Client('Invalid to', 'to', boards));
  }
};


//XXXX redo resolve
exports.resolveAccess = function(req, res, next) {
  var boards = req.param('board');
  var channel = req.param('channel');
  var to = req.param('to');

  if (boards && to && to.length) {
    return next(errors.Client('To - Board conflict', 'to', to));
  } else if (boards) {
    req.body.to = [].concat(boards).map(function(board) {
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
          address.allow = address.allow.map(function(entry) {
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