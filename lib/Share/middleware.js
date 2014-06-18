var Share = require('./model');
var Group = require('lib/Group').model;
var _ = require('lodash');
var errors = require('lib/errors');
var access = require('lib/access');
var utils = require('lib/utils');
var Seq = require('seq');

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
  next();
};

exports.validateContext = function(req, res, next) {
  var contexts = [].concat(req.param('context'));
  if (contexts.length) {
    //XXX this isnt working - look into it
    req.params.context = contexts;
    next()
  } else {
    next(errors.Client('Invalid context', 'contexts', contexts));
  }
};

//XXXX redo resolve
exports.resolveDefaultAccess = function(req, res, next) {
  var channel = req.param('channel');
  var contexts = [].concat(req.param('contexts'));

  Seq(contexts)
  .parMap(function(ctx) {
    var cb = this;
    // Allow it to be an array of strings, that are just ids
    if('string' === typeof ctx) {
      ctx = {id: ctx};
    }

    if (! (ctx.allow && ctx.allow.length)) {
      Group.findById(ctx.id, function(err, group) {
        if (err) return cb(err);
        if(! group) return cb(errors.NotFound('Group not found'));

        // Copy the group's default access
        ctx.allow = group.access.allow;

        //XXX no public access for shares with channels (a bit hacky)
        if (channel) {
          ctx.allow = ctx.allow.map(function(entry) {
            entry = access.decode(entry);
            if (entry.type === 'public') {
              entry.type = 'group';
              entry.id = ctx.id;
            }
            return access.encode(entry);
          });
        }

        cb(null, ctx);
      });
    } else
      cb(null, ctx);
  })
  .flatten()
  .seq(function() {
    var contexts = [].slice.call(arguments);
    req.body.contexts = contexts;
    this();
  })
  .seq(next)
  .catch(next);
};

exports.addUserContext = function(req, res, next) {
  _.remove(req.body.contexts, {id: req.auth.id});

  req.body.contexts.push({
    id: req.auth.id,
    allow: _.union.apply(_, req.body.contexts.map(function(ctx) {
      return ctx.allow;
    })),
    deny: _.union.apply(_, req.body.contexts.map(function(ctx) {
      return ctx.deny;
    }))[0]
  });

  next();
}

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

