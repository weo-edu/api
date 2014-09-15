var date = require('lib/date');
var moment = require('moment');
var io = require('lib/io');
var Seq = require('seq');
var Share = require('./model');
var hooks = exports;

exports.broadcast = function(evt) {
  return function(share, next) {
    // Don't broadcast messages about drafts
    if(share.status === 'draft')
      return;

    share.channels.forEach(function(channel) {
      io.sockets.to(channel);
    });

    io.sockets.send({
      params: {
        channel: share.channels,
        context: share.contextIds
      },
      tokens: share.tokens(),
      verb: evt,
      model: 'Share',
      data: share.toJSON()
    });

    next();
  };
};

exports.denyPendingAndUndenyActive = function() {
  return function(share, next) {
    var deny = 'student';
    if(share.status === 'active')
      deny = '';

    share.contexts.forEach(function(ctx) {
      ctx.deny = deny;
    });
    next();
  };
};

exports.setPublishedAt = function() {
  return function(share, next) {
    share.publishedAt = share.status === 'active'
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
  var broadcast = hooks.broadcast('change');

  return function(share, next) {
    share.channelModels(function(err, parents) {
      if(err || ! parents || ! parents.length)
        return next(err);

      // XXX this is all a bit hack, but it ensures the schemas are right
      Seq(parents)
        .parEach(function(parent) {
          var self = this;
          var leaf = parent.leaf;
          var model = parent.model;
          var prop = parent.property;

          if(leaf)
            model = model.object.find(leaf);

          model.populateSelfLink(prop, function(err, channel) {

            model.selfLink(prop)
              .context(share.contextIds)
              .push(share);

            channel.set({object: model[prop].toJSON()});
            channel.markModified('object');
            channel.save(function(err) {
              if (!err) {
                //XXX hacky, maybe save instead?
                if (parent.model.kind === 'Share') {
                  broadcast(parent.model, function(){});
                }
              }
              self(err);
            });
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