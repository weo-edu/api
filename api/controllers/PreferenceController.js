/**
 * PreferenceController
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
   * (specific to PreferenceController)
   */
  _config: {},
  _routes: {
    'GET @/?:name': 'get',
    'PUT @/:name': 'set'
  },
  get: function(req, res) {
    User.preferences(req.user.id, function(err, preferences) {
      if(err) return res.serverError(err);
      req.param('name')
        ? res.json(preferences[req.param('name')])
        : res.json(preferences);
    });
  },
  set: function(req, res) {
    User.setPreference(req.user.id, req.param('name'), req.body.value)
      .exec(function(err, user) {
        if(err) return res.serverError(err);
        res.send(204)
      });
  }  
};
