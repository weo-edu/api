/**
 * GroupController
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
   * (specific to GroupController)
   */
  _config: {},
  _routes: {
    '@/:type/:code': 'lookupCode'
  },
  lookupCode: function(req, res, next) {
    var selector = {};
    selector[req.param('type') + '_code'] = req.param('code');
    console.log('selector', selector);
    Group.findOne(selector)
      .exec(function(err, group) {
        console.log('group', err, group);
        if(err) throw err;
        if (!group) {
          return res.clientError(404, 'invalid code')
            .missing('Group', req.param('type') + '_code')
            .send();
        }
        res.json(group);
      });
  }
};

codes: ['teacher:W0', 'student:Y0']