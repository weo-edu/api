var access = require('lib/access');
var date = require('lib/date');
var moment = require('moment');
var io = require('lib/io');
var helpers = require('./helpers');
var Share = require('./model');

exports.broadcast = function(evt) {
  return function(share, next) {
    // send to all address access pairs
    share.to.forEach(function(address) {
      address.allow.forEach(function(entry) {
        if (! (address.deny && address.deny === access.decode(entry, 'role')))
          io.sockets.to(access.full(address.board, entry, share.channel));
      });

      io.sockets.send({
        id: address.board,
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
    if (!share.channel) return next;
    var parsed = helpers.parseChannel(share.channel);
    Share.findOne(parsed.share, function(err, aShare) {
      if (err) return next(err);
      var object = aShare.object.find(parsed.leaf);
      object.incrementTotal(parsed.property);
      _.each(object.getTotals(parsed.property), function(totalProperty) {
        object.incremetTotal(parsed.property, totalProperty, share.object[totalProperty]);
      });
      aShare.save(function() {
        next();
      });
    });
  };
}

