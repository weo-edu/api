var access = require('lib/access');
var date = require('lib/date');
var moment = require('moment');
var _ = require('lodash');
var io = require('lib/io');
var markdown = require('lib/markdown');

exports.broadcast = function(evt) {
  return function(share, next) {
    // send to all address access pairs
    _.each(share.to, function(address) {
      _.each(address.allow, function(entry) {
        if (! (address.deny && address.deny === access.decode(entry, 'role')))
          io.sockets.to(access.full(address.id, entry, share.parent.id));
      });

      io.sockets.send({
        id: address.id,
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

exports.generateContent = function() {
  return function(share, next) {
    if(share.object.originalContent) {
      // Escape regular content
      share.object.content = markdown(share.object.originalContent);
    }

    next();
  };
};

