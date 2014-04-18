/**
 * UserController
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
var Seq = require('seq');

module.exports = {
  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to UserController)
   */
  _config: {},
  _routes: {
    'GET @': 'me',
    'PATCH @': 'updateMe',
    'GET @/groups/:type?': 'groups',
    'GET @/feed': {
      controller: 'event',
      action: 'feed'
    },
    'POST @/events': {
      controller: 'event',
      action: 'emit'
    },
    'POST @/events/queue': {
      controller: 'event',
      action: 'queue'
    },
    'GET @/events': {
      controller: 'event',
      action: 'events'
    },
    'PATCH @/avatar': {
      controller: 'avatar',
      action: 'change'
    }
  },
  groups: function(req, res) {
    User.groups(req.user.id, req.param('type'), function(err, groups) {
      if (err instanceof databaseError.NotFound) {
        if (err && err.message === 'User') {
          return res.clientError('User not found')
            .missing('user', 'id')
            .send(404);
        }
      }
      if (err) throw err;
      res.json(_.invoke(groups, 'toJSON'));
    });
  },
  me: function(req, res) {
    var token = req.access_token;
    if(! token)
      return res.end();

    Seq()
      .seq(function() {
        // If no token, return empty data
        if(! token) return this(null, null);
        Auth.lookupToken(token, this);
      })
      .seq(function(data) {
        // if no data, then we want to return an empty
        // user object
        if(! data) return this(null, {});

        User.findOne(data.id, this);
      })
      .seq(function(user) {
        res.json(user);
      })
      .catch(function(err) {
        res.serverError(err);
      });
  },
  updateMe: function(req, res) {
    if(! req.user) return res.json(404);
    // XXX We probably want to filter this some.  For instance,
    // the client probably shouldn't be able to set their user type
    User.update(req.user.id, req.body).exec(function(err, user) {
      if(err) return res.serverError(err);
      res.json(user);
    });
  }
};
