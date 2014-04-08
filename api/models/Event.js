var subSchema = require('../services/subSchema');
var date = require('../../lib/date');
var moment = require('moment');

/**
 * Event
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
      icon: 'string'
    })
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
    object: {
      type: 'json',
      entity: true
    },
    type: {
      type: 'string',
      required: true
    },
    // defines which roles can see event
    visibility: {
      type: 'string'
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
  receivedBy: function(to, role) {
    return Event.find({to: to, or: [{visibility: role}, {visibility: undefined}]});
  },
  producedBy: function(userId) {
    return Event.find({'actor.id': userId});
  },
  createAndEmit: function(userId, evt, cb) {
    _.defaults(evt, {published_at: moment().toISOString()});
    User.get(userId, function(err, user) {
      if (err) return cb(err);
      evt.actor = Event.userToActor(user);
      Event.create(evt)
        .exec(function(err, createdEvent) {
          if(err) return cb(err);
          Event.emit(createdEvent, 'add');
          
          cb(null, createdEvent);
        });
    });
  },

  emit: function(evt, verb) {
    var roles = evt.visibility 
      ? [evt.visibility]
      : ['teacher', 'student'];
    _.each(roles, function(role) {
      _.each(evt.to, function(to) {
        var roleTo = {id: role + ':' + to};
        Event.publish(roleTo, {
          model: Event.identity,
          verb: verb,
          data: evt,
          id: to
        });
      });
    });
  },

  // XXX maybe this can be a general response
  createAndEmitRes: function(res) {
    return function(err, createdEvent) {
      if (err instanceof databaseError.NotFound) {
        return res.clientError('User not found')
          .missing('user', 'id')
          .send(404);
      } else if (err) {
        res.serverError(err);
      } else {
        res.json(201, createdEvent);
      }
    };
  },
  queue: function(evt) {
    evt.status = 'pending';
    evt.visibility = 'teacher';
    evt.published_at = date.max();
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