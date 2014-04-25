var actions = module.exports;
var Group = require('./model');
var User = require('lib/User/model');
require('lib/crud')(actions, Group);

var create = actions.create;
actions.create = function(req, res, next) {
  req.body.owners = req.body.owners || [];
  req.body.owners.push(req.auth.id);
  create(req, res, next);
};

actions.join = function(req, res, next) {
  req.params.user = req.auth.id;
  req.params.id = req.group.id;
  actions.addUser(req, res, next);
};

actions.addUser = function(req, res, next) {
  User.joinGroup(req.param('user'), req.param('id'), function(err) {
    if(err) return res.mongooseError(err);
    res.send(200);
  });
};

actions.archive = function(req, res, next) {
  if(! req.group)
    return next('Archive action requires req.group');

  req.group.status = 'archived';
  req.group.save(function(err, group) {
    if(err) return res.mongooseError(err);
    res.json(group);
  });
};