var Group = require('lib/Group').model;
var errors = require('lib/errors');
var utils = require('lib/utils');
var Seq = require('seq');
var Share = require('./model');
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
  var contexts = [].concat(req.param('contexts'));
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

  var channel = req.me.getChannel('activities');
  if(req.body.channels.indexOf(channel) === -1)
    req.body.channels.push(channel);
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
    if(! req[name]) return next('canEdit requires req.' + name);
    if(! req[name].canEdit(req.auth))
      return next(errors.Authorization('You do not have access to that share'));
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

    // The owner just gets the share as-is
    // XXX: In the future, when we add the ability to have
    // multiple teachers in a single class this logic will have to
    // get much more complex
    if(req.share.isOwner(req.me))
      return done(inst);

    Share.find()
      .where('_root.id', req.share.id)
      .where('actor.id', user.id)
      .exec(function(err, instances) {
        if(err) return next(err);
        var inst = _.find(instances, function(inst) {
          return inst.contextIds.indexOf(context) !== -1;
        });

        if(inst) {
          done(inst);
        } else {
          req.share.createInstance(context, req.user)
            .save(function(err, inst) {
              err ? next(err) : done(inst);
            });
        }
      });
  };
};