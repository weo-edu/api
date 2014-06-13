var access = require('lib/access');
var date = require('lib/date');
var moment = require('moment');
var io = require('lib/io');
var Share = require('./model');

exports.broadcast = function(evt) {
  return function(share, next) {
    // send to all address access pairs
    share.to.forEach(function(address) {
      address.allow.forEach(function(entry) {
        if (! (address.deny && address.deny === access.decode(entry).role)) {
          io.sockets.to(access.full(address.board, entry, share.channel));
        }
      });

      io.sockets.send({
        board: address.board,
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
    share.to.forEach(function(address) {
      address.deny = share.status === 'pending'
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
      var selfLink = object.selfLink(parsed.property).board(share.boards);

      selfLink.push(share);
      aShare.save(function(err) {
        next();
      });
    });
  };
};