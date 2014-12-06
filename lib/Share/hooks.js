var date = require('lib/date');
var moment = require('moment');
var io = require('lib/io');
var Share = require('./model');
var async = require('async');
var _ = require('lodash');
var chutil = require('lib/Channel/helpers');

exports.broadcast = function(evt) {
  return function(share, next) {
    if (share.status === 'draft')
      return next();

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


    async.each(share.channels, function(channel, cb) {
      chutil.withModel(channel, function(err, parent) {
        if (err || !parent) return cb(err);

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
          parent.done();
          cb(err);
        });
      });
    }, function(err) {
      next(err);
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


exports.createAllInstances = function() {
  return function(share, next) {
    //XXX better sheet checking
    if (share.isPublished() && share.object.objectType === 'section' && share.shareType === 'share') {
      var usersByContext = {};
      async.each(share.contextIds, function(contextId, cb) {
        share.getMembers([contextId])
          .exec(function(err, students) {
          if (err)
            return cb(err);
          usersByContext[contextId] = {};
          _.each(students, function(student) {
            usersByContext[contextId][student.id] = student;
          });
          cb(null, students);
        });
      }, function(err) {
        if (err)
          return next(err);
        var instances = [];
        _.each(share.contextIds, function(contextId) {
          var createdInstances = share.selfLink('instances').context(contextId).actors();
          var allStudents = _.keys(usersByContext[contextId]);
          var needToCreate = _.difference(allStudents, createdInstances);
          _.each(needToCreate, function(studentId) {
            instances.push(share.createInstance({
              context: contextId,
              user: usersByContext[contextId][studentId],
              status: 'draft'
            }));
          });
        });

        async.each(instances, function(instance, cb) {
          instance.save(cb);
        }, function(err) {
          next(err);
        });
      });

    }
  };
};


exports.undraft = function() {
  return function(share, next) {
    if (share.status === 'draft' && share.object.objectType === 'section' && share.shareType === 'share')
      share.status = 'pending';
    next();
  };
};