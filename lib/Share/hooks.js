var date = require('lib/date');
var moment = require('moment');
var io = require('lib/io');
var Seq = require('seq');
var Share = require('./model');

exports.broadcast = function(evt) {
  return function(share, next) {
    share.channels.forEach(function(channel) {
      io.sockets.to(channel);
    });

    io.sockets.send({
      params: {
        channel: share.channels,
        context: share.contextIds
      },
      tokens: share.tokens(),
      deny: share.deny,
      verb: evt,
      model: 'Share',
      data: share.toJSON()
    });

    next();
  };
};

exports.denyPendingAndUndenyActive = function() {
  return function(share, next) {
    // This hook does not apply to shareInstances
    // and tips
    if(share.isInstance() || share.object.objectType === 'tip')
      return next();

    var deny = 'student';
    if(share.isPublished())
      deny = '';

    share.deny = deny;
    next();
  };
};

exports.setPublishedAt = function() {
  return function(share, next) {
    share.publishedAt = share.isPublished()
      ? moment().toISOString()
      : date.max();
    next();
  };
};

exports.setQueuedAt = function() {
  return function(share, next) {
    share.queuedAt = share.isQueued()
      ? moment().toISOString()
      : date.max();
    next();
  };
};


exports.generateId = function() {
  return function(share, next) {
    share.setId();
    next();
  };
};

// XXX we need to lock aggregation to make sure multiple updates don't happen at once
exports.aggregateChannel = function() {

  return function(share, next) {
    if (share.$dispatch && share.$dispatch.aggregated)
      return;
    if(share.$dispatch)
      share.$dispatch.aggregated = true;
    var wasNew = share.wasNew; // cache, gets deleted after execution of hook
    share.channelModels(function(err, parents) {
      if(err || ! parents || ! parents.length) {
        return next(err);
      }

      Seq(parents)
        .parEach(function(parent) {
          var self = this;
          var leaf = parent.leaf;
          var model = parent.model;
          var prop = parent.property;

          if(leaf)
            model = model.object.find(leaf);

          // XXX For now if we don't find anything
          // fail silently
          if(! model || !model.selfLink)
            return self(null);

          var selfLink = model.selfLink(prop)
            .context(share.contextIds);

          if (wasNew) {
            selfLink.push(share);
          } else {
            selfLink.update(share);
          }

          parent.model.versioning = false;
          parent.model.save(function(err) {
            self(err);
          });


        })
        .seq(function() { next(); })
        .catch(next);
    });
  };
};

exports.dispatchObjectType = function() {
  return function(share, next) {
    Share.schema.dispatch('pre:add:' + share.object.objectType, share.object, next);
  };
};

exports.createProfileShare = function(adverbMatch) {
  return function(profileEvt, next) {
    if (adverbMatch && profileEvt.adverb !== adverbMatch)
      return next && next();

    //XXX this might be getting called before user is completely constructed

    var user = profileEvt.user;
    var share = user.createProfile();
    share.object.displayName = profileEvt.type;
    switch(profileEvt.type) {
      case 'color':
        share.object.content = user.color;
        break;
      case 'aboutMe':
        share.object.content = user.aboutMe;
        break;
      case 'avatar':
        share.object.content = user.imageUrl;
        break;
    }

    share.save();
    next();
  };
};

exports.setInstanceVerb = function() {
  return function(share, next) {
    if(share.isInstance()) {
      if(share.isQueued())
        share.verb = 'started';
      else if(share.isPublished())
        share.verb = 'completed';
    }

    next();
  };
};
