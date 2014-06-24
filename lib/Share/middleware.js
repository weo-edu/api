var Group = require('lib/Group').model;
var errors = require('lib/errors');
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

//XXXX redo resolve
exports.resolveDefaultAccess = function(req, res, next) {
  var contexts = [].concat(req.param('contexts'));

  Seq(contexts)
  .parMap(function(ctx) {
    var cb = this;
    // Allow it to be an array of strings, that are just ids
    if('string' === typeof ctx)
      ctx = {id: ctx};

    if (! (ctx.allow && ctx.allow.length)) {
      Group.findById(ctx.id, function(err, group) {
        if (err) return cb(err);
        if(! group) return cb(errors.NotFound('Group not found'));

        // Copy the group's default access
        ctx.allow = group.access.allow;
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
  var channel = 'user:' + req.auth.id + '.activities';
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