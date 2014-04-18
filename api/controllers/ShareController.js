var moment = require('moment');

/**
 * ShareController
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

function toParamIsValid(to) {
  // Ensure all to's are truthy
  return _.isArray(to)
    ? _.all(to, _.identity)
    : !! to;
}

module.exports = {
  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to ShareController)
   */
  _config: {},
  _routes: {
    'POST @': 'create',
    'POST @/subscription': 'createSubscription',
    'DELETE @/subscription': 'deleteSubscription',
    'DELETE @/:id': 'delete',
    'PATCH @/:id/publish': 'dequeue'
  },
  create: function(req, res) {
    var userId = req.user.id;
    var share = req.params.all();
    Share.createAndEmit(userId, share, function(err, share) {
      if (err) return res.serverError(err);
      else {
        res.json(201, share.toJSON());
      }
    });
  },
  dequeue: function(req, res) {
    var id = req.param('id');
    Share.update({id: id}, {
      status: 'active',
      visibility: undefined,
      published_at: moment().toISOString()
    }, function(err, evts) {
      if (err) {
        return res.serverError(err);
      }
      var evt = evts[0];
      Share.emit(evt, 'update');
      res.json(200, evts[0]);
    });
  },
  createSubscription: function(req, res) {
    var to = req.param('to');
    console.log('feed subscription', to);
    if (! toParamIsValid(to)) {
      res.clientError('Invalid to param')
        .missing('subscription', 'to')
        .send(400);
    } else {
      if (req.socket) {
        to = _.map([].concat(to), function(id) {
          return {id: req.user.role + ':' + id};
        })
        Share.subscribe(req.socket, to);
      }
      res.send(201);
    }
  },
  deleteSubscription: function(req, res) {
    var to = req.param('to');
    if (! toParamIsValid(to)) {
      res.clientError('Invalid to param')
        .missing('subscription', 'to')
        .send(400);
    } else {
      if(req.socket) {
        to = _.map([].concat(to), function(id) {
          return req.user.role + ':' + id;
        })
        Share.unsubscribe(req.socket, to);
      }
      res.send(204);
    }
  },
  delete: function(req, res) {
    var id = req.param('id');
    Share.findOne({id: id}).done(function(err, share) {
      if (err) {
        return res.serverError(err);
      } else if (!share) {
        return res.clientError('Share not found')
          .missing('share', 'id')
          .send(404);
      } else if (req.user.id !== share.actor.id) {
        // only allowed to delete shares user has created
        return res.send(403);
      } else if (share.status === 'active') {
        // cant delete active share
        return res.send(403);
      }
      Share.destroy({id: id}).done(function(err) {
        if (err) {
          res.serverError(err);
        } else {
          Event.emit(e, 'delete');
          res.send(204);
        }
      });
    });
  },
  to: function(req, res) {
    var to = req.param('to');
    if (!to) {
      return res.clientError('Invalid to param')
        .missing('share', 'to')
        .send(400);
    }
    Share.receivedBy(to, req.user.role)
      .sort({published_at: -1, createdAt: -1})
      .exec(function(err, shares) {
        if(err) throw err;
        if(! shares) return res.json(404);
        res.json(shares);
      });
  }
};

