/**
 * Event
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var subSchema = require('../services/subSchema.js');

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
    payload: 'json'
  },
  receivedBy: function(to, role) {
    return Event.find({to: to, or: [{visibility: role}, {visibility: undefined}]});
  },
  producedBy: function(userId) {
    return Event.find({'actor.id': userId});
  },
  createAndEmit: function(evt, cb) {
    Event.create(evt)
      .exec(function(err, createdEvent) {
        if(err) return cb(err);
        _.each(createdEvent.to, function(to) {
          Event.publish(to, {
            model: Event.identity,
            verb: 'add',
            data: createdEvent,
            id: to
          });
        });
        cb(null, createdEvent);
      });

  },
  userToActor: function(user) {
    return {
      id: user.id,
      avatar: avatar(user.id),
      name: user.name,
      link: '/user/' + user.id
    }
  }
};