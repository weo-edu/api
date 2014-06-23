var access = require('lib/access');
var date = require('lib/date');
var moment = require('moment');
var io = require('lib/io');
var Share = require('./model');

exports.broadcast = function(evt) {
  return function(share, next) {
    // send to all context/access pairs
    share.contexts.forEach(function(ctx) {
      ctx.allow.forEach(function(entry) {
        if (! (ctx.deny && ctx.deny === access.decode(entry).role)) {
          io.sockets.to(access.full(ctx.id, entry, share.channel));
        }
      });

      io.sockets.send({
        context: ctx.id,
        channel: share.channel,
        verb: evt,
        model: 'Share',
        data: share.toJSON()
      });
    });

    next();
  };
};

exports.denyPending = function() {
  return function(share, next) {
    share.contexts.forEach(function(ctx) {
      ctx.deny = share.status === 'pending'
        ? 'student'
        : undefined;
    });
    next();
  };
};

exports.setPublished = function() {
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
  }
};

exports.generateFullPath = function() {
  return function(share, next) {
    if (share.fullPath) {
      return next();
    }
    share.parent(function(err, parent) {
      if (err) return next(err);
      if (!parent) {
        share.fullPath = share._id;
      } else {
        var parsed = share.parseChannel()
        share.fullPath = [parent.fullPath, parsed.path, share._id].join('.');
      }
      next();
    });
  }
};

exports.aggregateChannel = function() {
  return function(share, next) {
    share.parent(function(err, aShare) {
      if (err) return next(err);
      if (!aShare) return next();

      var parsed = share.parseChannel();
      var object = aShare.object.find(parsed.leaf);
      var selfLink = object.selfLink(parsed.property).context(share.contextIds);

      selfLink.push(share);
      aShare.save(function(err) {
        next();
      });
    });
  };
};