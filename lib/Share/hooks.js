var access = require('lib/access');
var date = require('lib/date');
var moment = require('moment');
var io = require('lib/io');
var helpers = require('./helpers');
var Share = require('./model');
var _ = require('lodash');

exports.broadcast = function(evt) {
  return function(share, next) {
    // send to all address access pairs
    share.to.forEach(function(address) {
      address.allow.forEach(function(entry) {
        if (! (address.deny && address.deny === access.decode(entry, 'role'))) {
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

exports.aggregateChannel = function() {
  return function(share, next) {
    if (!share.channel) return next();
    var parsed = helpers.parseChannel(share.channel);

    // XXX Do a better check for this
    if(! parsed.leaf)
      return;

    Share.findById(parsed.share, function(err, aShare) {
      if (err) return next(err);
      var object = aShare.object.find(parsed.leaf);

      var selfLink = object.selfLink(parsed.property).board(aShare.boards);
      selfLink.increment('items', 1);

      selfLink.totals().forEach(function(key) {
        selfLink.increment(key, share.object[key]);
      });

      aShare.save(function() {
        next();
      });
    });
  };
}

