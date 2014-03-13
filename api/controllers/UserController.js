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
module.exports = {
  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to UserController)
   */
  _config: {},
  _routes: {
    'GET /user/groups/:type': 'groups',
    'GET @/feed': {
      controller: 'event',
      action: 'feed'
    },
    'POST @/events': {
      controller: 'event',
      action: 'emit'
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
      res.json(_.map(groups, function(group) {return group.toJSON()}));
    })
  }
};
