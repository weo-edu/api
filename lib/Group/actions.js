var actions = module.exports;
var Group = require('./model');
var User = require('lib/User/model');
var Student = require('lib/Student').model;
var errors = require('lib/errors');
var _ = require('lodash');

require('lib/crud')(actions, Group);

var create = actions.create;
actions.create = function(req, res, next) {
  req.body.owners = req.body.owners || [];
  req.body.owners.push(req.auth.id);

  if(req.body.parent) {
    Group.findById(req.body.parent).exec(function(err, group) {
      if(err) return next(errors.Server(err));
      if(! group) return next(errors.Client('Parent not found', 'parent', req.body.parent));
      req.body.owners = [].concat(group.owners);
      req.body.owners = _.uniq(req.body.owners);
      create(req, res, next);
    });
  } else
    create(req, res, next);
};

actions.join = function(req, res, next) {
  req.params.id = req.group.id;
  req.user = req.me;
  actions.addUser(req, res, next);
};

actions.addUser = function(req, res, next) {
  if(! req.user) return next('addUser requires req.user');
  if(! req.group) return next('addUser requires req.group');

  if(! req.user.joinGroup(req.group.id))
    return next(errors.Client('User is already a member of that group'));

  req.user.save(function(err, user) {
    if (err) return next(err);
    res.json(req.group);
  });
};

actions.removeUser = function(req, res, next) {
  if(! req.user) return next('removeUser requires req.user');
  if(! req.group) return next('removeUser requires req.group');

  if(! req.user.leaveGroup(req.group.id))
    return next(errors.Client('User is not a member of that group'));

  req.user.save(function(err, user) {
    if(err) return next(err);
    res.json(req.group);
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

actions.lookup = function(req, res, next) {
  res.json(req.group);
};

actions.studentsInGroups = function(req, res, next) {
  var groups = [].concat(req.param('board'));
  Student.find()
    .in('groups', groups)
    .exec(function(err, students) {
      if(err) return next(err);
      res.json(students);
    });
};