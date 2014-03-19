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
    'DELETE @/subscription': 'deleteSubscription'
  },
  emit: function(req, res) {
    var evt = req.params.all();
    var to = evt.to;
    User.findOne(req.user.id)
      .exec(function(err, user) {
        if(err) throw err;
        if(! user) return res.send(404);

        evt.actor = Event.userToActor(user);
        Event.createAndEmit(evt, function(err, createdEvent) {
          if (err) return res.serverError(err);
          res.json(201, createdEvent);
        });
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
  events: function(req, res) {
    Event.producedBy(req.user.id)
      .sort('createdAt DESC')
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
      .sort('createdAt DESC')
      .exec(function(err, events) {
        if(err) throw err;
        if(! events) return res.json(404);
        res.json(events);
      });
  }
};
