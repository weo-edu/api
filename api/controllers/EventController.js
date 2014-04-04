var moment = require('moment');

/**
 * EventController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */
module.exports = {
  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to EventController)
   */
  _config: {},
  _routes: {
    'POST @/subscription': 'createSubscription',
    'DELETE @/subscription': 'deleteSubscription',
    'DELETE @/:id': 'delete',
    'PATCH @/:id/publish': 'publish'
  },
  emit: function(req, res) {
    var evt = req.params.all();
    Event.createAndEmit(req.user.id, evt, Event.createAndEmitRes(res));
  },
  queue: function(req, res) {
    var evt = req.params.all();
    Event.queue(evt);
    Event.createAndEmit(req.user.id, evt, Event.createAndEmitRes(res));
  },
  publish: function(req, res) {
    var id = req.param('id');
    Event.update({id: id}, {
      status: 'active', 
      visibility: undefined, 
      published_at: moment().toISOString()
    }, function(err, evts) {
      if (err) {
        return res.serverError(err);
      }
      var evt = evts[0];
      _.each(evt.to, function(to) {
        Event.publish(to, {
          model: Event.identity,
          verb: 'update',
          data: evt,
          id: to
        });
      });
      res.json(200, evts[0]);
    });
  },
  createSubscription: function(req, res) {
    var to = req.param('to');
    if (!to) {
      return res.clientError('Invalid to param')
        .missing('subscription', 'to')
        .send(400);
    }
    if (req.socket) {
      Event.subscribe(req.socket, to);
    }
    res.send(201);
  },
  deleteSubscription: function(req, res) {
    var to = req.param('to');
    if (!to) {
      return res.clientError('Invalid to param')
        .missing('subscription', 'to')
        .send(400);
    }
    if (req.socket) {
      Event.unsubscribe(req.socket, to);
    }
    res.send(204);
  },
  delete: function(req, res) {
    var id = req.param('id');
    console.log('id', id);
    Event.findOne({id: id}).done(function(err, e) {
      if (err) {
        return res.serverError(err);
      } else if (!e) {
        return res.clientError('Event not found')
          .missing('event', 'id')
          .send(404);
      } else if (req.user.id !== e.actor.id) {
        // only allowed to delete events user has created
        return res.send(403);
      } else if (e.status === 'active') {
        // cant delete active event
        return res.send(403);
      }
      Event.destroy({id: id}).done(function(err) {
        if (err) {
          res.serverError(err);
        } else {
          _.each(e.to, function(to) {
            Event.publish(to, {
              model: Event.identity,
              verb: 'delete',
              data: e,
              id: to
            });
          });
          res.send(204);
        }
      });
    });
  },
  events: function(req, res) {
    Event.producedBy(req.user.id)
      .sort({published_at: -1, createdAt: -1})
      .exec(function(err, events) {
        if(err) throw err;
        res.json(events);
      });
  },
  feed: function(req, res) {
    var to = req.param('to');
    if (!to) {
      return res.clientError('Invalid to param')
        .missing('event', 'to')
        .send(400);
    }
    Event.receivedBy(to, req.user.role)
      .sort({published_at: -1, createdAt: -1})
      .exec(function(err, events) {
        if(err) throw err;
        if(! events) return res.json(404);
        res.json(events);
      });
  }
};

