var Seq = require('seq')
  , modelHook = require('../../lib/modelHook');

modelHook.on('group:addMember', function(data, next) {
  var group = data.groupId;
  var user = data.user;
  Group.publish(group, {
    model: Group.identity,
    verb: 'add',
    data: user,
    id: group
  });
  next();
});

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
    'PUT @/join/:code': 'join',
    'GET @/lookup/:code': 'lookup',
    'PUT @/:id/members/:user': 'addMember',
    '@/students': 'studentsInGroups',
    '@/:id': 'get',
    'POST @/create': 'create',
    '@/:to/assignments': {
      action: 'find',
      controller: 'assignment'
    },
    'POST @/members/subscription': 'createSubscription',
    'DELTE @/members/subscription': 'deleteSubscription'
    
  },
  get: function(req, res) {
    Group.findOne(req.param('id'))
      .exec(function(err, group) {
        if (err) return res.serverErorr(err);
        if (!group) {
          return res.clientError('Group not found')
            .missing('group', 'id')
            .send(404);
        }

        res.json(group);
      });
  },
  create: function(req, res) {
    var name = req.param('name');
    var type = req.param('type') || 'class';
    var user = req.user.id;

    User.groups(user, type, function(err, groups) {
      var find = _.where(groups, {name: name});
      if (find.length) {
        res.clientError('Group name taken')
          .alreadyExists('group', 'name')
          .send(409);
      } else {
         Seq()
          .seq(function() {
            Group.create({
              name: name,
              owners: [req.user.id]
            }).done(this);
          })
          .seq(function(group) {
            this.vars.group = group;
            User.addToGroup(req.user.id, group.id, this);
          })
          .seq(function() {
            modelHook.emit('group:create', this.vars.group);
            res.json(201, this.vars.group);
          })
          .catch(function(err) {
            res.serverError(err);
          });
      }
    });
  },
  lookup: function(req, res) {
    var code = req.param('code');
    Group.findOne({code: caseSensitive(code)}).done(function(err, group) {
      if(err) return res.serverError(err);
      if(! group) {
        return res.clientError('Group not found')
          .missing('group', 'code')
          .send(404);
      }
      res.send(204);
    });
  },
  join: function(req, res) {
    var code = req.param('code');
    Group.addUser({code: caseSensitive(code)}, req.user.id, function(err, group) {
      if(err instanceof databaseError.NotFound) {
        return res.clientError(err.message + ' not found')
          .missing(err.message.toLowerCase(), err.message === 'Group' ? 'code' : 'id')
          .send(404);
      }
      res.json(group);
    });
  },
  addMember: function(req, res) {
    Group.addUser(req.param('id'), req.param('user'), function(err, group) {
      if(err instanceof databaseError.NotFound) {
        return res.clientError(err.message + ' not found')
          .missing(err.message.toLowerCase(), 'id')
          .send(404);
      }
      res.json(group);
    });
  },
  studentsInGroups: function(req, res) {
    var groupIds = req.param('groups');
    Student.findAssignable(groupIds, function(err, groups) {
      if(err) throw err;
      res.json(groups);
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
      Group.subscribe(req.socket, to);
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
      Group.unsubscribe(req.socket, to);
    }
    res.send(204);
  }

};