var access = require('lib/access');
var date = require('lib/date');
var moment = require('moment');
var _ = require('lodash');

exports.broadcast = function(io, evt) {
  return function(share, next) {
    var sockets = io.set('sockets');
    if (!sockets) return;
    // send to all address access pairs
    _.each(share.to, function(address) {
      _.each(address.allow, function(entry) {
        if (address.deny && address.deny === access.decode(entry, 'role'))
          return;
        sockets.to(access.full(address.id, entry, share.channel));
      });
    });

    sockets.send({verb: evt, data: share.toJSON()});
    next();
  };
};

exports.denyPending = function() {
  return function(share, next) {
    _.each(share.to, function(address) {
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
