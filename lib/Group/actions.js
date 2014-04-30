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
  req.params.id = req.group.id;
  actions.addUser(req, res, next);
};

actions.addUser = function(req, res, next) {
  var user = req.me
    , groupId = req.param('id');

  user.joinGroup(groupId);
  user.save(function(err, user) {
    if (err) return next(err);
    res.json(user);
  });
};

actions.archive = function(req, res, next) {
  if(! req.group)
    return next('Archive action requires req.group');

  req.group.status = 'archived';
  req.group.save(function(err, group) {
    if(err) return next(err);
    res.json(group);
  });
};