var Seq = require('seq')
  , modelHook = require('../../lib/modelHook');

function parseId(id) {
  var selector = {};
  var key = null;
  if (id.length === 24) {
    selector._id = id;
    key = 'id';
  } else {
    selector.code = new RegExp('^' + id + '$');
    key = 'code';
  }
  return {selector: selector, key: key};
}

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
    '@/:id': 'get',
    'GET @/:groupId/events': {
      controller: 'event',
      action: 'receivedBy'
    },
    '@/:group/assignments': {
      action: 'findAssignments',
      controller: 'assignment'
    },
    '@/:group/assignments/student/:student': {
      action: 'findAssignments',
      controller: 'assignment'
    }
  },
  get: function(req, res) {
    var id = req.param('id');
    var parsedId = parseId(id);
    Group.findOne(parsedId.selector)
      .exec(function(err, group) {
        if (err) throw err;
        if (!group) {
          return res.clientError('Group not found')
            .missing('group', parsedId.key)
            .send(404);
        }

        res.json(group);
      });
  },
  createNew: function(req, res) {
    var name = req.param('name')
      , userId = req.param('teacher');

    Seq()
      .seq(function() {
        Group.create({name: name}).done(this);
      })
      .seq(function(group) {
        this.vars.group = group;
        User.addToGroup(userId, group.id, this)
      })
      .seq(function() {
        res.json(201, this.vars.group);
      })
      .catch(function(err) {
        throw err;
      });
  },
  addMember: function(req, res) {

    var userId = req.param('user')
      , groupId = req.param('id')
      , parsedId = parseId(groupId);

    Group.findOne(parsedId.selector).done(function(err, group) {
      if (err) throw err;
      if (!group) {
        return res.clientError('Group not found')
          .missing('group', 'code')
          .send(404);
      }
      User.addToGroup(userId, group.id, function(err, user) {
        if (err) throw err;
        modelHook.emit('group:addMember', {groupId: group.id, user: user}, function(err) {
          if (err) console.error('Error in group:addMember hook:' + err.message);
          res.send(204);
        });
      });
    });

  }
};