var Seq = require('seq');

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
    'PUT @/:id/members/:user': 'addMember',
    '@/:id': 'get'
  },
  get: function(req, res) {
    var id = req.param('id');
    Group.findOne(id)
      .exec(function(err, group) {
        console.log('err', err, group);
        if (err) throw err;
        if (!group) {
          return res.clientError('Group not found')
            .missing('group', 'id')
            .send(404);
        }

        res.json(group);
      });
  },
  createNew: function(req, res) {
    var name = req.param('name')
      , userId = req.param('user');
    Seq()
      .seq(function() {
        Group.create({name: name}).done(this);
      })
      .seq(function(group) {
        this.vars.group = group;
        User.addToGroup(userId, group.id, this)
      })
      .seq(function() {
        res.json(this.vars.group);
      })
      .catch(function(err) {
        throw err;
      });
  },
  addMember: function(req, res) {
    var userId = req.param('user')
      , groupId = req.param('id');

    User.addToGroup(userId, groupId,function(err) {
      if (err) throw err;
      res.json({groupId: groupId});
    })
  }
};