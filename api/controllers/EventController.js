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
    '@/all': 'allForStudent'
  },
  allForStudent: function(req, res) {
    res.json({user: req.user});
  },
  producedBy: function(req, res) {
    var user = req.param('userId');
    Event.find({'actor.id': user})
      .exec(function(err, events) {
        if(err) throw err;
        res.json(events);
      });
  },
  receivedBy: function(req, res) {
    var group = req.param('groupId');
    Event.find({group_id: group})
      .exec(function(err, events) {
        if(err) throw err;
        res.json(events);
      });
  }
};
