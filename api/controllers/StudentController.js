/**
 * StudentController
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
var mergeModels = require('../../lib/mergeModels.js')
  , UserController = require('./UserController.js')
module.exports = mergeModels(UserController, {
  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to StudentController)
   */
  _config: {},
  _routes: {
    'PATCH @/:userId/password': 'setPassword',
  },
  setPassword: function(req, res) {
    User.setPassword(req.param('userId'), req.param('password'), function(err, users) {
      err ? res.serverError(err) : res.json(200, users[0]);
    });
  }
});
