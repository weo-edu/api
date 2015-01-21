var date = require('lib/date');
var moment = require('moment');
var io = require('lib/io');
var Share = require('./model');
var async = require('async');
var _ = require('lodash');
var mongoose = require('mongoose');
var chutil = require('lib/Channel');

exports.broadcast = function(evt) {
  return function(share, next) {
    var evts = [];
    if (evt === 'change' && !_.isEqual(share.previous('channels'), share.channels)) {
      evts.push({evt: 'add', channels: _.difference(share.channels, share.previous('channels'))});
      evts.push({evt: 'remove', channels: _.difference(share.previous('channels'), share.channels)});
      evts.push({evt: 'update', channels: _.intersection(share.previous('channels'), share.channels)});
    } else {
      evts.push({evt: evt, channels: share.channels});
    }

    evts.forEach(function(pair) {
      pair.channels.forEach(function(channel) {
        io.sockets.to(channel);
      });
      io.sockets.to(share.id);
      io.sockets.send({
        params: {
          id: share.id,
          channel: pair.channels,
          context: share.contextIds
        },
        tokens: share.tokens(),
        deny: share.deny,
        verb: pair.evt,
        model: 'Share',
        data: share.toJSON()
      });
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
exports.aggregateChannel = function(type) {
  return function(share, next) {
    if (share.$dispatch && share.$dispatch.aggregated) {
      next();
      return;
    }
    if(share.$dispatch)
      share.$dispatch.aggregated = true;

    var typeChannelPairs = [];
    if (type === 'update' && !_.isEqual(share.channels, share.previous('channels'))) {
      _.difference(share.channels, share.previous('channels')).forEach(function(channel) {
        typeChannelPairs.push({type: 'add', channel: channel});
      });

      _.difference(share.previous('channels'), share.channels).forEach(function(channel) {
        typeChannelPairs.push({type: 'remove', channel: channel});
      });
      
      _.intersection(share.previous('channels'), share.channels).forEach(function(channel) {
        typeChannelPairs.push({type: 'update', channel: channel});
      });
      
    } else {
      share.channels.forEach(function(channel) {
        typeChannelPairs.push({type: type, channel: channel});
      });
      
    }

    async.each(typeChannelPairs, function(pair, cb) {
      chutil.withModel(pair.channel, function(err, parent) {
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

        if (pair.type === 'add') {
          selfLink.push(share);
        } else if (pair.type === 'remove') {
          selfLink.remove(share);
        } else {
          selfLink.update(share);
        }

        console.log('parent save', parent.model.kind);
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
    if (share.isPublished() && share.isSheet()) {
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
              status: 'unstarted'
            }));
          });
        });

        async.each(instances, function(instance, cb) {
          instance.save(cb);
        }, function(err) {
          next(err);
        });
      });
    } else
      next();
  };
};


exports.undraft = function() {
  return function(share, next) {
    if (share.isDraft() && share.isSheet())
      share.status = 'pending';
    next();
  };
};

exports.checkDraftChannel = function() {
  return function(share, next) {
    if (share.isSheet() && share.status === 'pending') {
      share.sendToDrafts();
    } else if (share.isSheet() && share.previous('status') === 'pending') {
      console.log('send to classes');
      share.sendToClasses();
    } else if (share.isSheet() && share.status === 'draft') {
      share.channels = [];
    } else if (share.isSheet() && share.previous('status') === 'draft') {
      share.sendToDrafts();
    }

    next();
  };
}

exports.createStatusUpdate = function() {
  return function(share) {
    if (share.status === 'active') {
      var User = mongoose.model('User');
      User.findById(share.actor.id, function(err, user) {
        var channel = user.getChannel('activities');
        var shareStatus = share.createChild('status', {channels: [channel]});
        var actor = user.toKey();
        shareStatus.object.status = 'active';
        shareStatus.object.instance = share.isInstance();
        // XXX this isnt necessarily right / no access to user who changed the status
        shareStatus.set({actor: actor});
        shareStatus.save();

      });
      
    }
  };
};