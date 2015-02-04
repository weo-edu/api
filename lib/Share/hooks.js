var date = require('lib/date');
var moment = require('moment');
var io = require('lib/io');
var Schema = require('./schema');
var async = require('async');
var _ = require('lodash');
var mongoose = require('mongoose');
var channel = require('lib/channel');


function broadcast(evt) {
  return function(share) {
    var json = share.toJSON();
    var tokens = share.tokens();
    var contextIds = share.contextIds;

    if(evt === 'remove') {
      send('remove', share.channels);
    } else {
      if(share.wasNew) {
        send('add', share.channels);
      } else if(! share.wasModified('channels')) {
        send('change', share.channels);
      } else {
        send('add', _.difference(share.channels, share.$channels));
        send('remove', _.difference(share.$channels, share.channels));
        send('change', _.intersection(share.$channels, share.channels));
      }
    }

    function send(verb, channels) {
      channels.forEach(function(channel) {
        io.sockets.to(channel);
      });

      io.sockets.to(share.id);
      io.sockets.send({
        params: {
          id: share.id,
          channel: channels,
          context: contextIds
        },
        tokens: tokens,
        deny: share.deny,
        verb: verb,
        model: 'Share',
        data: json
      });
    }
  };
}

Schema.post('save', broadcast('save'));
Schema.post('remove', broadcast('remove'));

// Ensure every share has an id before it is validated
Schema.pre('validate', function(next) {
  this._id = this._id || new mongoose.Schema.Types.ObjectId;
  next();
});

function aggregate(evt) {
  return function(share) {
    var types = {push: [], remove: [], update: []};

    if (evt === 'save') {
      if(share.wasModified('channels')) {
        types.push = _.difference(share.channels, share.$channels);
        types.remove = _.difference(share.$channels, share.channels);
        types.update = _.intersection(share.$channels, share.channels)
      } else
        types.update = share.channels;
    } else if(evt === 'remove')
      types.remove = share.channels;

    Object.keys(types).forEach(function(type) {
      types[type].forEach(function(chan) {
        channel.withModel(chan, function(err, parent) {
          function done(err) {
            parent.done();
          }

          if (err || ! parent)
            return done(err);

          if(share.aggregate(type, parent)) {
            parent.model.versioning = false;
            parent.model.save(done);
          } else
            done();
        });
      });
    });
  };
};

Schema.post('save', aggregate('save'));
Schema.post('remove', aggregate('remove'));


exports.createAllInstances = function() {
Schema.post('save', function(share) {
  if (share.isSheet() && ! share.isDraft() && share.wasModified('publishedAt')) {
    async.each(share.contextIds, function(contextId, cb) {
      share.getMembers([contextId])
        .exec(function(err, students) {
        if (err) return cb(err);

        var selfLink = share.selfLink('instances').context(contextId);
        students = students.filter(function(student) {
          return selfLink.hasActor(student.id);
        });

        async.each(students, function(student, cb) {
          share.createInstance({
            context: contextId,
            user: student.id
          }).save(cb);
        }, cb);
      });
    }, next);
  } else
    next();
  };
};


/**
 * Init
 */
Schema.post('init', function(doc) {
  doc.$channels = doc.channels;
});

// This post('save') must come after all
// other post save's to ensure that
// it can re-setup the prior channels
Schema.post('save', function(doc) {
  doc.$channels = doc.channels;
});