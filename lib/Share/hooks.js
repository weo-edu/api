var date = require('lib/date');
var moment = require('moment');
var io = require('lib/io');
var _ = require('lodash');
var mongoose = require('mongoose');
var chutil = require('lib/channel');
var Schema = require('./schema');
var InstanceSchema = require('./shareInstanceSchema');


/**
 * Pre validate
 */
 // Ensure every share has an id before it is validated
 Schema.pre('validate', function(next) {
   this._id = this._id || new mongoose.Schema.Types.ObjectId;
   next();
 });

/**
 * Post save/remove
 */

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

function aggregate(evt) {
  return function(share) {
    if(share.wasNew
      || evt === 'remove'
      || share.wasModified('status')
      || share.wasModified('channels')
      || share.object.wasModified && share.object.wasModified('points.scaled')) {
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
        types[type].forEach(function(channel) {
          chutil.withModel(channel, function(err, parent) {
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
    }
  };
};

Schema.post('save', aggregate('save'));
Schema.post('remove', aggregate('remove'));


// Create all of the instances for a sheet
// when it is published
function createInstances(share) {
  console.log('createInstances', share.$previous, share.isSheet(), share.$wasDraft, share.isDraft());
  if (share.isSheet() && share.$wasDraft && ! share.isDraft()) {
    share.contextIds.forEach(function(contextId) {
      share.getMembers([contextId])
        .exec(function(err, students) {
        if (err) return console.log('createAllInstances err', err);

        var selfLink = share.selfLink('instances').context(contextId);
        students
        .filter(function(student) {
          return selfLink.hasActor(student.id);
        })
        .forEach(function(student) {
          share.createInstance({
            context: contextId,
            user: student.id
          }).save(function(err) {
            if(err) return console.log('createAllInstances save err', err);
          });
        });
      });
    });
  }
}

Schema.post('save', createInstances);


/**
 * Init
 */

function storePrevious(doc) {
  console.log('storePrevious');
  doc.$channels = doc.channels;
  doc.$wasDraft = doc.isDraft();
}

Schema.post('init', storePrevious);
InstanceSchema.post('init', storePrevious);

// This post('save') must come after all
// other post save's to ensure that
// it can re-setup the prior channels
// Schema.post('save', storePrevious);