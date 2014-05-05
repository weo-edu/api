var middleware = module.exports;
var Group = require('./model');
var _ = require('lodash');

/*
  Policy to ensure that the current user
  is an owner of this group
 */
middleware.isOwner = function(req, res, next) {
  if(! req.auth)
    return next('isOwner requires req.auth');
  if(! req.group)
    return next('isOwner requires req.group');
  if(! req.group.isOwner(req.auth.id))
    return res.send(403, 'You are not the owner of that group');
  next();
};

/*
  Check the a user is a member of the groups passed in
  the parameter in question
 */
middleware.belongsTo = function(paramName) {
  return function(req, res, next) {
    if(! req.me)
      return next('belongsTo requires req.me');

    var to = req.param(paramName);
    var belongsTo = (req.me.groups || []).concat(req.me.id).map(function(id) {
      return id.toString();
    });

    if(_.intersection(to, belongsTo).length !== to.length)
      return res.send(403, "You don't have access to one or more of those groups");

    next();
  };
};

middleware.exists = function(paramId) {
  return function(req, res, next) {
    Group.findById(req.param(paramId), function(err, group) {
      if (group)
        next();
      else
        next(404);
    });
  }
}