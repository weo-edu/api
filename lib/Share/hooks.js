var date = require('lib/date');
var moment = require('moment');
var io = require('lib/io');
var Seq = require('seq');
var Share = require('./model');
var User = require('lib/User').model;

exports.broadcast = function(evt) {
  return function(share, next) {
    // Don't broadcast messages about drafts
    if(share.status === 'draft')
      return;

    // send to all context/access pairs
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

exports.denyPending = function() {
  return function(share, next) {
    share.contexts.forEach(function(ctx) {
      if(share.status === 'pending')
        ctx.deny = 'student';
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

exports.aggregateChannel = function() {
  return function(share, next) {
    share.parents(function(err, parents) {
      if(err || ! parents || ! parents.length)
        return next(err);

      Seq(parents)
        .parEach(function(parent) {
          var leaf = parent.leaf;
          var model = parent.model;
          var prop = parent.property;

          if(leaf)
            model = model.object.find(leaf);

          model.selfLink(prop)
            .context(share.contextIds)
            .push(share);

          parent.model.save(this);
        })
        .seq(function() { next(); })
        .catch(next);
    });
  };
};

exports.dispatchObjectType = function() {
  return function(share, next) {
    Schema.dispatch('pre:add:' + share.object.objectType, share.object, next);
  };
};

exports.createProfileShare = function(adverbMatch) {
  return function(profileEvt, next) {
    if (adverbMatch && profileEvt.adverb !== adverbMatch)
      return next && next();

    //XXX this might be getting called before user is completely constructed

    var user = profileEvt.user;
    var share = user.createProfile();
    console.log('user', user.url, user.id);
    share.object.displayName = profileEvt.type;
    console.log('share', share.actor);
    share.save();
    next();
  };
};