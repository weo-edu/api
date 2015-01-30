var Group = require('lib/Group').model;
var Share = require('./model');
var errors = require('lib/errors');
var utils = require('lib/utils');
var Seq = require('seq');
var selfLink = require('lib/schema-plugin-selflink');
var _ = require('lodash');

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
  if (! share.actor || !share.actor.id) {
    share.actor = req.me.toKey();
  }
  next();
};

//XXXX redo resolve
exports.resolveDefaultAccess = function(req, res, next) {
  var contexts = req.paramAsArray('contexts');
  Seq(contexts)
  .parMap(function(ctx) {
    var cb = this;
    // Allow it to be an array of strings, that are just ids

    if (! (ctx.allow && ctx.allow.length)) {
      Group.findById(ctx.id || ctx, function(err, group) {
        if (err) return cb(err);
        if(! group) return cb(errors.NotFound('Group not found'));

        if('string' === typeof ctx) {
          ctx = {descriptor: group.toAbstractKey()};
        }

        // Copy the group's default access
        ctx.allow = Group.defaultAllow(group.toKey());
        cb(null, ctx);
      });
    } else
      cb(null, ctx);
  })
  .flatten()
  .seq(function() {
    req.body.contexts = [].slice.call(arguments);
    this();
  })
  .seq(next)
  .catch(next);
};

exports.addUserChannel = function(req, res, next) {
  if(! req.me) return next('addUserChannel requires req.me');

  if(Share.isProfileShare(req.body)) {
    var channel = req.me.getChannel('activities');
    if(req.body.channels.indexOf(channel) === -1)
      req.body.channels.push(channel);
  }

  next();
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

exports.canEdit = function(Model) {
  var name = utils.uncapitalize(Model.modelName);
  return function(req, res, next) {
    if(! req.auth) return next('canEdit requires req.auth');
    var share = req[name];

    if(! share) return next('canEdit requires req.' + name);
    if(! share.canEdit(req.auth)) {
      if(! (share.isInstance() && share.isRootOwner(req.auth)))
        return next(errors.Authorization('You do not have access to that share'));
    }

    next();
  };
};

exports.canGrade = function() {
  return function(req, res, next) {
    if(! req.auth) return next('canGrade requires req.auth');

    var share = req.share;
    if(! share.isInstance())
      return next(errors.Client('You cannot return a root share'));
    if(! share.isRootOwner(req.auth))
      return next(errors.Authorization('You do not have permission to grade that share'));

    next();
  };
};

exports.getInstance = function() {
  return function(req, res, next) {
    var user = req.user || req.me;
    var context = req.param('context');

    if(! context) {
      context = req.share.contextsForUser(user)[0];
      context = context ? context.descriptor.id : 'public';
    }

    function done(inst) {
      req.share = inst;
      next();
    }

    req.share.findInstances()
      .where('actor.id', user.id)
      .exec(function(err, instances) {
        if(err) return next(err);
        var inst = _.find(instances, function(inst) {
          return inst.contextIds.indexOf(context) !== -1;
        });

        if(inst) {
          // If the user who's instance this is is opening it for the
          // first time, switch the status to 'pending'
          if(inst.isUnopened() && req.me.id === req.user.id) {
            inst.status = 'pending';
            return inst.save(function(err, inst) {
              if(err) return next(err);
              done(inst);
            });
          } else
            done(inst);
        } else {
          req.share.createInstance({
            context: context,
            user: req.user,
            // If the user requesting the shareInstance is not the user
            // who's instance it is, then we don't want to consider
            // the share 'started' yet, and that corresponds to 'draft'
            // status
            status: req.user.id === req.me.id ? 'pending' : 'unstarted'
          }).save(function(err, inst) {
            err ? next(err) : done(inst);
          });
        }
      });
  };
};

exports.update = function() {
  return function(req, res, next) {
    var update = req.body;
    selfLink.strip(update);
    req.share.set(update);
    next();
  };
};