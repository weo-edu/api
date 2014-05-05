var middleware = module.exports;
var Group = require('./model');
var errors = require('lib/errors');
var _ = require('lodash');

/*
  Policy to ensure that the current user
  is an owner of this group
 */
middleware.isOwner = function(req, res, next) {
  if(! req.auth)
    return next(errors.Server('isOwner requires req.auth'));
  if(! req.group)
    return next(errors.Server('isOwner requires req.group'));
  if(! req.group.isOwner(req.auth.id))
    return next(errors.Authorization('You are not the owner of that group'));
  next();
};

/*
  Check the a user is a member of the groups passed in
  the parameter in question
 */
middleware.belongsTo = function(paramName) {
  return function(req, res, next) {
    if(! req.me)
      return next(errors.Server('belongsTo requires req.me'));

    var to = [].concat(req.param(paramName));
    var belongsTo = (req.me.groups || []).concat(req.me.id).map(function(id) {
      return id.toString();
    });

    if(_.intersection(to, belongsTo).length !== to.length) {
      console.log('access denied', to, belongsTo);
      return next(errors.Authorization(
        "You don't have access to one more more of those groups"));
    }

    next();
  };
};