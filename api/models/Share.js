var subSchema = require('../services/subSchema');
var date = require('../../lib/date');
var moment = require('moment');

var VISIBILITY_DELIMITER = ':';

/**
 * Share
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */


//XXX should events have an `at` param so that you can set future events

module.exports = {
  types: {
    entity: subSchema({
      id: {required: true},
      name: {required: true, type: 'string'},
      link: {required: true, type: 'string'},

      // actor uses avatar, object uses icon
      avatar: 'string',
    }),


  },
  attributes: {
    to: {
      type: 'array',
      required: true
    },
    actor: {
      type: 'json',
      required: true,
      entity: true
    },
    verb: {
      type: 'string',
      required: true
    },

    // object.payload is used for properties that
    // should not be loaded in the feed
    // object.payload.instance is used for properties that
    // should not be reshared
    object: {
      type: 'json',
    },
    type: {
      type: 'string',
      required: true
    },
    published_at: {
      type: 'date',
      required: true
    },
    status: {
      in: ['active', 'pending'],
      defaultsTo: 'active',
      required: true
    },
    payload: 'json'
  },
  receivedBy: function(to, user) {
    to = Share.normalizeRequestTo(to, user);
    return Share.find({to: to});
  },
  createAndEmit: function(userId, share, cb) {
    //XXX why is access token in share?
    delete share.access_token;

    share.to = Share.normalizeCreateTo(share.to);
    Share.setDefaults(share);
    User.get(userId, function(err, user) {
      if (err) return cb(err);
      share.actor = Share.userToActor(user);
      if (!share.id) {
        Share.create(share)
          .exec(function(err, createdShare) {
            if(err) return cb(err);
            Share.emit(createdShare, 'add');
            
            cb(null, createdShare);
          });
      } else {
        Share.update({id: share.id}, share)
          .exec(function(err, updatedShares) {
            if (err) return cb(err);
            var updatedShare = updatedShares[0];
            Share.emit(updatedShare, 'update');
            cb(null, updatedShare);
          });
      }
      
    });
  },

  emit: function(share, verb) {
    _.each(share.to, function(to) {
      Share.publish(to, {
        model: Share.identity,
        verb: verb,
        data: share,
        id: share.id
      });
    });
  },

  // XXX maybe this can be a general response
  createAndEmitRes: function(res, status) {
    return function(err, createdShare) {
      if (err instanceof databaseError.NotFound) {
        return res.clientError('User not found')
          .missing('user', 'id')
          .send(404);
      } else if (err) {
        res.serverError(err);
      } else {
        res.json(status || 201, createdShare);
      }
    };
  },

  normalizeCreateTo: function(to) {
    var newTo = [];
    _.each(to, function(id) {
      var idSplit = id.split(VISIBILITY_DELIMITER);
      if (!idSplit[1]) {
        newTo.push(id + VISIBILITY_DELIMITER + 'teacher');
        newTo.push(id + VISIBILITY_DELIMITER + 'student');
      } else {
        newTo.push(id);
      }
    });
    return _.unique(newTo); //XXX is this necessary?
  },

  normalizeRequestTo: function(to, user) {
    to = [].concat(to);
    to = _.map(to, function(id) {
      return id + VISIBILITY_DELIMITER + user.role;
    });
    if (role === 'student') {
      to = to.concat(_.map(to, function(id) {
        return id.split(VISIBILITY_DELIMITER)[0] + VISIBILITY_DELIMITER + user.id;
      }));
    }
    return to;
  },

  setDefaults: function(share) {
    if (share.queue) {
      share.status = 'pending';
      share.visibility = 'teacher';
      share.published_at = date.max();
      delete share.queue;
    } else if (share.dequeue) {
      share.status = 'active';
      share.visibility = undefined;
      share.published_at = moment().toISOString();
      delete share.dequeue;
    } else {
      _.defaults(share, {published_at: moment().toISOString()});
    }
    
  },
  userToActor: function(user) {
    return {
      id: user.id,
      avatar: avatar(user.id),
      name: user.name || User.defaultName(user),
      link: '/user/' + user.id
    }
  }
};